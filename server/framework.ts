import {bareServer, RequestError, Request, FullRequest} from './bare-server'
import {configureCookieSession} from '../cookie-session'
import {matchPage} from '../flare/ssr'
import {rpcRoute, publicRoute} from '../route'
import {sendFile} from './send-file';
import path from 'path'

type Handler<T> = (r: Request<'new', T>) => Promise<null | FullRequest>

/** A server with SSR, RPC, and cookie sessions */
export function server<Session>(serverDir: string, handler: Handler<{ session: Session }>) {

  const config = require(serverDir + '/config')
  const pageDir = path.join(serverDir, '../client/pages')
  const publicDir = path.join(serverDir, '../../public')
  const cookieSession = configureCookieSession<Session>({ secret: config.session_secret })

  const _server = bareServer(async _r => {
    let m, r = cookieSession(_r)

    const r2 = await handler(r)

    if (r2) return r2

    if (m = r.match('POST', rpcRoute)) {
      const procs = await import(`${serverDir}/procs`)
      if (! procs[m.proc]) {
        throw new RequestError(404, 'not_found', { reason: `No such propc: ${m.proc}` })
      }
      const result = await procs[m.proc](await r.json()) // TODO: Match JSON-RPC standard
      return r.send(JSON.stringify(result)) // TODO: Match JSON-RPC standard
    }
    else if (m = matchPage(r)) {
      return r.send(await m.bundlePage(pageDir))
    }
    else if (m = r.match('GET', publicRoute)) {
      return sendFile(r, m.path.join('/'), {
        root: publicDir,
        isDev: config.isDev,
      })
    }
    else {
      throw new RequestError(404, 'not_found')
    }
  })

  return _server
}
