import {IncomingMessage, ServerResponse} from 'http'
import {Route} from '../route'
import {json, buffer} from 'micro'
import {Readable} from 'stream'

type Handler = (r: NewRequest) => Promise<FullRequest>

//
// Request
//
type NewRequest = Request<'new', {}>;
export type FullRequest = Request<'full', any>;

type ResHeaders = Record<string,string | undefined>

type ResState = 'new' | 'full'

export class Request<S extends ResState, Ctx> {
  constructor(
    private _s: S,
    public ctx: Ctx,
    public req: IncomingMessage,
    private _res: ServerResponse,
    public readonly responseHeaders: ResHeaders = {},
    public readonly responseStatus = 200,
    public readonly body: string | Readable = '',
  ) {
    if (! (req as any).state) { (req as any).state = {} }
  }

  /**
   * Creates a new request with set headers.
   * To delete, set a header value to `undefined`
   **/
  setHeaders(headers: ResHeaders) {
    const newHeaders = { ...this.responseHeaders, ...headers }
    return new Request(this._s, this.ctx, this.req, this._res, newHeaders, this.responseStatus, this.body)
  }
  setStatus(status: number) {
    return new Request(this._s, this.ctx, this.req, this._res, this.responseHeaders, status, this.body)
  }

  send<ctx>(this: Request<'new', ctx>, body: string | object | Readable) {
    if (!isStream(body) && typeof body !== 'string') {
      body = JSON.stringify(body)
    }
    return new Request('full', this.ctx, this.req, this._res, this.responseHeaders, this.responseStatus, body)
  }

  assign<T>(data: T) {
    return new Request(this._s, { ...this.ctx, ...data }, this.req, this._res, this.responseHeaders, this.responseStatus, this.body)
  }

  get url(): string {
    return this.req.url || ''
  }
  get method(): string {
    return this.req.method || ''
  }

  json() {
    return json(this.req).catch(() => {
      throw new RequestError(400, 'invalid_json')
    })
  }
  buffer() {
    return buffer(this.req)
  }

  async rpc(route: Route<{ proc: string }>, procs: Record<string, (params: any) => any>) {
    let m;
    if (m = this.match('POST', route)) {
      return { result: await procs[m.proc](await this.json()) }
    }
    return null
  }

  /** Only use if you know what you're doing. */
  dangerouslyGetRes() {
    return this._res
  }

  //
  // Convenience helpers to allow for if-statement assignments
  //
  match<T>(method: string, route: RouteMatcher<T>) {
    return this.req.method === method && route.match(this.url) || null
  }
  match_p<T>(method: string, route: RouteMatcher<T>) {
    return this.req.method === method && route.match_p(this.url) || null
  }
}

type RouteMatcher<T> = {
  match: (url: string) => T | null
  match_p: (url: string) => T | null
}

//
// Lib
//
export class RequestError extends Error {
  constructor(public status: number, message: string, public data?: object) {
    super(message)
  }
}

/** A bare serer without all the bells and whistles. */
export function bareServer (handler: Handler) {
  return async function microWrap (req: IncomingMessage, res: ServerResponse) {
    try {
      const result = await handler(new Request('new', {}, req, res))
      res.writeHead(result.responseStatus, result.responseHeaders)
      if (isStream(result.body)) {
        result.body.pipe(res)
      }
      else {
        res.end(result.body)
      }
    }
    catch(err) {
      if (err instanceof RequestError) {
        res.writeHead(err.status)
        res.end(JSON.stringify({
          error: err.message,
          data: err.data,
        }))
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          console.error(err)
        }
        res.writeHead(500)
        res.end(JSON.stringify({
          error: 'unexpected_error',
          message: err.message
        }))
      }
    }
  }
}

function isStream(obj: any): obj is Readable {
  return typeof obj.pipe === 'function'
}
