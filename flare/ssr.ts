//
// Page bundler for browser
//
import {Request} from '../server/server'
import {route} from '../route'
import {rollup} from 'rollup'
import {normalize} from 'path'
const typescript = require('rollup-plugin-typescript')
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')

export function bundlePage (src: string) {
  return rollup({
    input: src,
    treeshake: true,
    output: {
      format: 'iife',
      name: 'Page',
      file: src,
    },
    plugins: [
      {
        resolveId(path) {
          if (path === 'solarjs/flare') {
            console.log("CAUGHT1", path)
            return require.resolve('./browser.ts')
          }
          if (path === 'nanohtml') {
            console.log("CAUGHT2", path)
            return require.resolve('nanohtml/lib/browser.js')
          }
          return null
        },
      },
      typescript(),
      nodeResolve({ jsnext: true, main: true, browser: true }),
      commonjs(),
    ]
  })
}

//
// Route match helper for convenience
//
const entry = route('/entry/:pageName', { pageName: 'str' })

export function matchEntryFile (r: Request<'new', any>) {
  let m;
  if (m = r.match('GET', entry)) {
    const {pageName} = m
    return {
      pageName,
      async bundle(pageDir: string) {
        const bundle = await bundlePage(normalize(pageDir + '/' + pageName))
        const result = await bundle.generate({ format: 'iife', name: 'Page' })
        return result.output[0].code
      }
    }
  }
  return null
}
