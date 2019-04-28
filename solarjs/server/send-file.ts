//
// Originally based off koa-send
//
import {Request, RequestError} from './bare-server'
import * as fs from 'fs'
const resolvePath = require('resolve-path')

import {
  normalize,
  basename,
  extname,
  resolve,
  parse,
  sep
} from 'path'

type Options = {
  /** Root directory to restrict file access */
  root?: string
  /** Name of the index file to serve automatically when visiting the root location. (defaults to none) */
  index?: string
  /** Browser cache max-age in milliseconds. (defaults to 0) */
  maxAge?: number
  /** Tell the browser the resource is immutable and can be cached indefinitely. (defaults to false */
  immutable?: boolean
  /** Allow transfer of hidden files. (defaults to false) */
  hidden?: boolean
  /** Try to serve the gzipped version of a file automatically when gzip is supported by a client and if the requested file with .gz extension exists. (defaults to true) */
  gzip?: boolean
  /** Try to serve the brotli version of a file automatically when brotli is supported by a client and if the requested file with .br extension exists. (defaults to true) */
  brotli?: boolean
  /** If not false (defaults to true), format the path to serve static file servers and not require a trailing slash for directories, so that you can do both /directory and /directory/ */
  format?: boolean
  /** Function to set custom headers on response */
  setHeaders?: <T>(r: Request<"new", T>, path: string, stats: fs.Stats) => Request<"new",T>
  /** Try to match extensions from passed array to search for file when no extension is sufficed in URL. First found is served. (defaults to false) */
  extensions?: string[],
  /** Set to true for more helpful debugging */
  isDev?: boolean,
}
export async function sendFile (r1: Request<"new", any>, path: string, opts: Options = {}) {
  // options
  const root = opts.root ? normalize(resolve(opts.root)) : ''
  const trailingSlash = path[path.length - 1] === '/'
  path = path.substr(parse(path).root.length)
  const index = opts.index
  const maxage = opts.maxAge || 0
  const immutable = opts.immutable || false
  const hidden = opts.hidden || false
  const format = opts.format !== false
  const extensions = Array.isArray(opts.extensions) ? opts.extensions : false
  const brotli = opts.brotli !== false
  const gzip = opts.gzip !== false
  const setHeaders = opts.setHeaders

  // normalize path
  try {
    path = decodeURIComponent(path)
  } catch (err) {
    throw new RequestError(400, '[send-file] failed to decode')
  }

  // index file support
  if (index && trailingSlash) path += index

  path = resolvePath(root, path)

  // hidden file support, ignore
  if (!hidden && isHidden(root, path)) {
    throw new RequestError(404, 'not_found', opts.isDev ? { is_hidden: true } : undefined)
  }

  let encodingExt = ''
  // serve brotli file when possible otherwise gzipped file when possible
  let r2;

  // Require here for lazy loading
  const preferredEncodings = require('negotiator/lib/encoding')

  const acceptsEncodings = (es: string[]) => preferredEncodings(r1.req.headers["accept-encoding"], es)
  if (acceptsEncodings(['br', 'identity']) === 'br' && brotli && (await exists(path + '.br'))) {
    path = path + '.br'
    r2 = r1.setHeaders({ 'Content-Encoding': 'br', 'Content-Length': undefined })
    encodingExt = '.br'
  } else if (acceptsEncodings(['gzip', 'identity']) === 'gzip' && gzip && (await exists(path + '.gz'))) {
    path = path + '.gz'
    r2 = r1.setHeaders({ 'Content-Encoding': 'gzip', 'Content-Length': undefined })
    encodingExt = '.gz'
  }

  if (extensions && !/\.[^/]*$/.exec(path)) {
    const list = ([] as string[]).concat(extensions)
    for (let i = 0; i < list.length; i++) {
      let ext = list[i]
      if (typeof ext !== 'string') {
        throw new TypeError('option extensions must be array of strings or false')
      }
      if (!/^\./.exec(ext)) ext = '.' + ext
      if (await exists(path + ext)) {
        path = path + ext
        break
      }
    }
  }

  // stat
  let stats
  try {
    stats = await stat(path)

    // Format the path to serve static file servers
    // and not require a trailing slash for directories,
    // so that you can do both `/directory` and `/directory/`
    if (stats.isDirectory()) {
      if (format && index) {
        path += '/' + index
        stats = await stat(path)
      } else {
        throw new RequestError(404, 'not_found')
      }
    }
  } catch (err) {
    if (err instanceof RequestError) {
      throw err
    }
    const notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR']
    if (notfound.includes(err.code)) {
      throw new RequestError(404, 'not_found', opts.isDev ? { err } : undefined)
    }
    err.status = 500
    throw err
  }

  const r3 = setHeaders ? setHeaders(r2 || r1, path, stats) : (r2 || r1)

  // stream
  const finalHeaders = {} as Record<string,string>
  finalHeaders['Content-Length'] = ''+stats.size

  if (!r3.responseHeaders['Last-Modified']) {
    finalHeaders['Last-Modified'] = stats.mtime.toUTCString()
  }
  if (!r3.responseHeaders['Cache-Control']) {
    const directives = ['max-age=' + (maxage / 1000 | 0)]
    if (immutable) {
      directives.push('immutable')
    }
    finalHeaders['Cache-Control'] = directives.join(',')
  }
  finalHeaders['Content-Type'] = type(path, encodingExt)
  return r3.setHeaders(finalHeaders).send(fs.createReadStream(path))
}

/**
 * Check if it's hidden.
 */

function isHidden (root: string, path: string) {
  const paths = path.substr(root.length).split(sep)
  for (let i = 0; i < paths.length; i++) {
    if (paths[i][0] === '.') return true
  }
  return false
}

/**
 * File type.
 */

function type (file: string, ext: string): string {
  // Require here for lazy loading
  const getType = require('cache-content-type')
  return getType(ext !== '' ? extname(basename(file, ext)) : extname(file))
}

function exists (path: string) {
  return new Promise<boolean>((resolve) => {
    fs.exists(path, resolve)
  })
}
function stat (path: string) {
  return new Promise<fs.Stats>((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) { reject(err) }
      else { resolve(stats) }
    })
  })
}
