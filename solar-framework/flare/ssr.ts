//
// Page bundler for browser
//
import {Request} from 'solarjs/server'
import {pagesRoute} from 'solarjs/route'
import {cssEntryPath} from './index'
import {getStylesheets, flushTitle, flushHead} from './index'
import {normalize} from 'path'
import {JSX, createElement} from 'preact'
import {render} from 'preact-render-to-string'

export function makeRenderPage(build_id: string | null) {
  build_id = build_id || null

  return function _renderPage <Props>(
    Page: (props: Props) => JSX.Element,
    props: Props,
  ) {
    if (!Page.name || Page.name.match(/^default_/i)) {
      return `
        <!doctype html>
        <title>Error: No page name</title>
        <h1>Missing page function name</h1>
        <p>Please ensure your page function is named and not anonymous. For example:</p>
  <pre>
  export default function my_page () {
    return &lt;h1&gt;Hi!&lt;/h1&gt;
  }
  </pre>
        <p>Where <code>my_page</code> corresponds to a file named <code>client/pages/my_page.entry.ts</code></p>
      `
    }

    const html = render(createElement(Page, props))
    const stylesheets = getStylesheets()
    const scriptPath = build_id
      ? `/assets/build/${Page.name}.entry-${build_id}.js`
      : `/assets/pages/${Page.name}.entry.js`

    return `
      <!doctype html>
      <title>${flushTitle()}</title>
      <meta charset="utf-8" />
      <link rel="stylesheet" type="text/css" href="${cssEntryPath('global.entry.css')}">
      ${flushHead()}
      ${Object.keys(stylesheets).map(id =>
        `<style data-id="${id}">${stylesheets[id]}</style>`
      ).join('\n')}
      <div id="root">
        ${html}
      </div>
      <script>
        window.__PAGE_PROPS__ = ${JSON.stringify(props)}
      </script>
      <script type="module" src="${scriptPath}"></script>
    `
  }
}

//
// Route match helper for convenience
//
export function matchPage (r: Request<'new', any>) {
  let m;
  if (m = r.match('GET', pagesRoute)) {
    const {pageName} = m
    return {
      pageName,
      async bundlePage(pageDir: string) {
        const {bundlePageDev} = await import('solar-dev/bundle-js')
        const bundle = await bundlePageDev(normalize(pageDir + '/' + pageName))
        const result = await bundle.generate({ format: 'iife', name: 'Page' })
        return result.output[0].code
      }
    }
  }
  return null
}
