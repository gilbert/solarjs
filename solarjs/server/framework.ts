import {bareServer, RequestError, Request, FullRequest} from './bare-server'
import {configureCookieSession} from '../cookie-session'
import {matchPage} from '../flare/ssr'
import {publicRoute, stylesRoute} from '../route'
import {sendFile} from './send-file';
import path from 'path'

const resolvePath = require('resolve-path')

type Handler<T> = (r: Request<'new', T>) => Promise<null | FullRequest>

/** A server with SSR, RPC, and cookie sessions */
export function server<Session>(serverDir: string, handler: Handler<{ session: Session }>) {

  const config = require(serverDir + '/config')
  const cssDir = path.join(serverDir, '../../client/styles')
  const pageDir = path.join(serverDir, '../client/pages')
  const publicDir = path.join(serverDir, '../../public')
  const cookieSession = configureCookieSession<Session>({ secret: config.session_secret })

  const _server = bareServer(async _r => {
    let m, r = cookieSession(_r)

    const r2 = await handler(r)

    if (r2) {
      if (config.isDev && (
        r.match('GET', stylesRoute) ||
        r.match('GET', publicRoute) ||
        matchPage(r)
      )) {
        console.warn('~~~~\n~~~\n~~\n  [solar] WARNING: Your server response is blocking a framework route.\n~~\n~~~\n~~~~')
      }
      return r2
    }

    if (m = matchPage(r)) {
      return r.send(await m.bundlePage(pageDir))
    }
    else if ((m = r.match('GET', stylesRoute))) {
      //
      // TODO: Implement production behavior
      //
      const {buildCss} = await import('solar-dev/build-css')
      const path = resolvePath(cssDir, m.entry)
      return r.setHeaders({ 'Content-Type': 'text/css' }).send(await buildCss(path))
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
