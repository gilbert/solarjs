import {bareServer, RequestError, Request, FullRequest} from './bare-server'
import {configureCookieSession} from '../cookie-session'
import {matchPage} from '../flare/ssr'
import {rpcRoute} from '../route'
import path from 'path'

type Handler<T> = (r: Request<'new', T>) => Promise<null | FullRequest>

/** A server with SSR, RPC, and cookie sessions */
export function server<Session>(serverDir: string, handler: Handler<{ session: Session }>) {

  const isDev = process.env.NODE_ENV === 'development'
  const config = require(serverDir + '/config')
  const pageDir = path.join(serverDir, '../client/pages')
  const cookieSession = configureCookieSession<Session>({ secret: config.session_secret })

  const _server = bareServer(async _r => {
    let m, r = cookieSession(_r)

    if (m = r.match('POST', rpcRoute)) {
      const procs = await import(`${serverDir}/procs`)
      if (! procs[m.proc]) {
        if (isDev) console.error('No such proc:', m.proc)
        throw new RequestError(404, 'not_found')
      }
      const result = await procs[m.proc](await r.json()) // TODO: Match JSON-RPC standard
      return r.send(JSON.stringify(result)) // TODO: Match JSON-RPC standard
    }
    else if (m = matchPage(r)) {
      return r.send(await m.bundlePage(pageDir))
    }

    const r2 = await handler(r)

    if (r2 === null) {
      throw new RequestError(404, 'not_found')
    }
    else {
      return r2
    }
  })

  return _server
}
