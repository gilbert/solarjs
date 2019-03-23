import {IncomingMessage, ServerResponse} from 'http'
import {Route} from '../route'
import {json, buffer} from 'micro'

type Handler = (r: NewRequest) => Promise<FullRequest>

//
// Request
//
type NewRequest = Request<'new', {}>;
type FullRequest = Request<'full', any>;

type ResHeaders = Record<string,string>

type ResState = 'new' | 'full'

export class Request<S extends ResState, Ctx> {
  constructor(
    private _s: S,
    public ctx: Ctx,
    public req: IncomingMessage,
    private _res: ServerResponse,
    public readonly headers: ResHeaders = {},
    public readonly status = 0,
    public readonly body = '',
  ) {
    if (! (req as any).state) { (req as any).state = {} }
  }

  setHeaders(headers: ResHeaders) {
    return new Request(this._s, this.ctx, this.req, this._res, {...this.headers, ...headers}, this.status, this.body)
  }

  send<ctx>(this: Request<'new', ctx>, body: string | object) {
    if (typeof body !== 'string') {
      body = JSON.stringify(body)
    }
    return new Request('full', this.ctx, this.req, this._res, this.headers, this.status, body)
  }

  assign<T>(data: T) {
    return new Request(this._s, { ...this.ctx, ...data }, this.req, this._res, this.headers, this.status, this.body)
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
  match<T>(method: string, route: Route<T>) {
    return this.req.method === method && route.match(this.url) || null
  }
  match_p<T>(method: string, route: Route<T>) {
    return this.req.method === method && route.match_p(this.url) || null
  }
}

//
// Lib
//
export class RequestError extends Error {
  constructor(public status: number, message: string, public data?: object) {
    super(message)
  }
}

export function server (handler: Handler) {
  return async function microWrap (req: IncomingMessage, res: ServerResponse) {
    try {
      const result = await handler(new Request('new', {}, req, res))
      res.end(result.body)
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
        res.writeHead(500)
        res.end(JSON.stringify({
          error: 'unexpected_error',
          message: err.message
        }))
      }
    }
  }
}
