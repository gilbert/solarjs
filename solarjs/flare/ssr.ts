//
// Page bundler for browser
//
import {Request} from '../server/bare-server'
import {route} from '../route'
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
    `
  }

  const html = render(createElement(Page, props))
  const stylesheets = getStylesheets()

  return `
    <!doctype html>
    <title>${getTitle()}</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" type="text/css" href="/styles/main.css">
    ${Object.keys(stylesheets).map(id =>
      `<style data-id="${id}">${stylesheets[id]}</style>`
    ).join('\n')}
    <div id="root">
      ${html}
    </div>
    <script>
      window.__PAGE_PROPS__ = ${JSON.stringify(props)}
    </script>
    <script src="/pages/${Page.name}.page.js"></script>
  `
}

//
// Route match helper for convenience
//
const pagesRoute = route('/pages/:pageName(.+\\.page\\.js)', { pageName: 'str' })

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
