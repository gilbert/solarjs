//
// Page bundler for browser
//
import {Request} from '../server/bare-server'
import {pagesRoute} from '../route'
import {getStylesheets, getTitle} from './index'
import {normalize} from 'path'
import {JSX} from 'preact'
import {createElement} from 'preact'
import {render} from 'preact-render-to-string'

export function renderPage <Props>(
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

  return `
    <!doctype html>
    <title>${getTitle()}</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" type="text/css" href="/assets/styles/global.entry.css">
    ${Object.keys(stylesheets).map(id =>
      `<style data-id="${id}">${stylesheets[id]}</style>`
    ).join('\n')}
    <div id="root">
      ${html}
    </div>
    <script>
      window.__PAGE_PROPS__ = ${JSON.stringify(props)}
    </script>
    <script src="/assets/pages/${Page.name}.entry.js"></script>
  `
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
        const {bundlePage} = await import('solar-dev/bundle-js')
        const bundle = await bundlePage(normalize(pageDir + '/' + pageName))
        const result = await bundle.generate({ format: 'iife', name: 'Page' })
        return result.output[0].code
      }
    }
  }
  return null
}
