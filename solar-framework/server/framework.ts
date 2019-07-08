import {server as bareServer, RequestError, Request, FullRequest} from 'solarjs/server'
import {matchPage} from '../flare/ssr'
import {publicRoute, stylesRoute} from 'solarjs/route'
import {sendFile} from './send-file';
import path from 'path'

const resolvePath = require('resolve-path')

type Handler<T> = (r: Request<'new', T>) => Promise<null | FullRequest>

/** A server with SSR, RPC, and cookie sessions */2
export function server(serverDir: string, handler: Handler<{}>) {

  const config = require(serverDir + '/config')
  const cssDir = path.join(serverDir, '../../client/styles')
  const pageDir = path.join(serverDir, '../client/pages')
  const publicDir = path.join(serverDir, '../../public')

  const _server = bareServer(async r => {

    let m
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

    const r2 = await handler(r)

    if (!r2) {
      // TODO: 404.html
      throw new RequestError(404, 'not_found')
    }
    return r2
  })

  return _server
}
