import {server as bareServer, RequestError, Request, FullRequest} from 'solarjs/server'
import {matchPage} from '../flare/ssr'
import {publicRoute, stylesRoute, buildRoute} from 'solarjs/route'
import {sendFile} from './send-file';
import path from 'path'

const resolvePath = require('resolve-path')

type Handler<T> = (r: Request<'new', T>) => Promise<null | FullRequest>

/** A server with SSR, RPC, and cookie sessions */
export function server(serverDir: string, handler: Handler<{}>) {

  const config = require(serverDir + '/config')
  const cssDir = path.join(serverDir, '../../client/styles')
  const pageDir = path.join(serverDir, '../client/pages')
  const buildDir = path.join(serverDir, '../client/_build')
  const publicDir = path.join(serverDir, '../../public')

  const buildCssDir = path.join(buildDir, '/styles')

  const _server = bareServer(async r => {

    let m
    if (config.isDev && (m = matchPage(r))) {
      return r.setHeaders({ 'Content-Type': 'text/javascript' }).send(await m.bundlePage(pageDir))
    }
    else if (m = r.match('GET', stylesRoute)) {
      if (config.isDev) {
        const {buildCssDev} = await import('solar-dev/build-css')
        const path = resolvePath(cssDir, m.entry)
        return r.setHeaders({ 'Content-Type': 'text/css' }).send(await buildCssDev(path))
      }
      else {
        return sendFile(r, m.entry, {
          root: buildCssDir,
          isDev: false,
        })
      }
    }
    else if (m = r.match('GET', buildRoute)) {
      return sendFile(r, m.path.join('/'), {
        root: buildDir,
        isDev: config.isDev,
      })
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
