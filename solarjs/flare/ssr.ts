//
// Page bundler for browser
//
import {Request} from '../server/bare-server'
import {route} from '../route'
import {getStylesheets, getTitle} from './index'
import {normalize} from 'path'

export function renderPage <Props>(
  Page: (props: Props) => HTMLElement,
  pageName: string,
  props: Props,
) {
  const html = Page(props)
  const stylesheets = getStylesheets()

  return `
    <!doctype html>
    <title>${getTitle()}</title>
    <link rel="stylesheet" type="text/css" href="/styles/app.entry.css">
    ${Object.keys(stylesheets).map(id =>
      `<style data-id="${id}">${stylesheets[id]}</style>`
    ).join('\n')}
    <div id="root">
      ${html}
    </div>
    <script>
      window.FLARE_PROPS = ${JSON.stringify(props)}
    </script>
    <script src="/pages/${pageName}.page.js"></script>
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
