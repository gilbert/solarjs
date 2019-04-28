import {rollup} from 'rollup'
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
            return require.resolve('./lib/browser.js')
          }
          if (path === 'nanohtml') {
            return require.resolve('nanohtml/lib/browser.js')
          }
          return null
        },
      },
      nodeResolve({ jsnext: true, main: true, browser: true }),
      commonjs(),
    ]
  })
}
