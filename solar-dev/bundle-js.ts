import * as path from 'path'
import {rollup} from 'rollup'
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const hypothetical = require('rollup-plugin-hypothetical')

export function bundlePage (src: string) {
  console.log("src", src, src.replace(/\.js$/, '.entry.js'))
  const entryName = src.replace(/\.js$/, '.entry.js')
  return rollup({
    input: entryName,
    treeshake: true,
    output: {
      format: 'iife',
      name: 'Page',
      file: entryName,
    },
    plugins: [
      hypothetical({
        files: {
          [entryName]: `
            import page from './${path.basename(src)}'
            import { h, render } from 'preact'

            // Hydrate
            const root = document.getElementById('root')
            render(h(page, __PAGE_PROPS__), root, root.lastElementChild)
          `
        },
        allowFallthrough: true,
        allowRelativeExternalFallthrough: true,
      }),
      {
        resolveId(path) {
          if (path === 'solarjs/flare') {
            return require.resolve('./lib/browser.js')
          }
          return null
        },
      },
      nodeResolve({ jsnext: true, main: true, browser: true }),
      commonjs(),
    ]
  })
}
