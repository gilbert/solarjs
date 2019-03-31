//
// Page bundler for browser
//
import {Request} from '../server/bare-server'
import {route} from '../route'
import {rollup} from 'rollup'
import {normalize} from 'path'
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')

export function renderPage <Props>(
  Page: (props: Props) => HTMLElement,
  props: Props,
  pageName: string,
) {
  const html = Page(props)

  return `
    <div id="root">
      ${html}
    </div>
    <script>
      window.FLARE_PROPS = ${JSON.stringify(props)}
    </script>
    <script src="/entry/${pageName}.js"></script>
  `
}

function bundlePage (src: string) {
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
            return require.resolve('./browser.js')
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

//
// Route match helper for convenience
//
const entry = route('/entry/:pageName', { pageName: 'str' })

export function matchPage (r: Request<'new', any>) {
  let m;
  if (m = r.match('GET', entry)) {
    const {pageName} = m
    return {
      pageName,
      async bundlePage(pageDir: string) {
        const bundle = await bundlePage(normalize(pageDir + '/' + pageName))
        const result = await bundle.generate({ format: 'iife', name: 'Page' })
        return result.output[0].code
      }
    }
  }
  return null
}
