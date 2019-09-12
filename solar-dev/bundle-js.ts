import * as path from 'path'
import {rollup} from 'rollup'
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const hypothetical = require('rollup-plugin-hypothetical')

export function bundlePageDev (src: string) {
  console.log("[solar-dev] Building page", src)
  const entryName = src.replace(/\.entry.js$/, '.dev.entry.js')
  return rollup({
    input: entryName,
    treeshake: true,
    output: {
      format: 'iife',
      name: 'Page',
      file: entryName,
    },
    plugins: commonPlugins([{ src, entryName }]),
  })
}

export function bundlePageProd (srcFiles: string[], hash: string) {
  const entryFiles = srcFiles.map(src => ({
    src,
    entryName: src.replace(/\.js$/, `-${hash}.js`),
  }))
  const {terser} = require('rollup-plugin-terser')

  return rollup({
    input: entryFiles.map(e => e.entryName),
    treeshake: true,
    plugins: [
      ...commonPlugins(entryFiles),
      terser({
        compress: {
          drop_console: true,
        },
      }),
    ],
  })
}

const commonPlugins = (entryFiles: { src: string, entryName: string }[]) => {
  const files: Record<string,string> = {}
  entryFiles.forEach(({ src, entryName }) =>
    files[entryName] = `
      import page from './${path.basename(src)}'
      import { h, render } from 'preact'

      // Hydrate
      const root = document.getElementById('root')
      render(h(page, __PAGE_PROPS__), root, root.lastElementChild)
    `
  )
  return [
    hypothetical({
      files,
      leaveIdsAlone: true,
      allowFallthrough: true,
      allowRelativeExternalFallthrough: true,
    }),
    {
      resolveId(path: any) {
        if (path === 'solar-framework/flare') {
          return require.resolve('./lib/browser.js')
        }
        return null
      },
    },
    nodeResolve({ mainFields: ['jsnext:main', 'module', 'main'], browser: true }),
    commonjs(),
  ]
}
