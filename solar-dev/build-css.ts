import postcss from 'postcss'
import * as fs from 'fs'
const cssImports = require('postcss-import')

export function buildCssDev (path: string) {
  return _buildCss(path, [cssImports])
}

export function buildCssProd (path: string) {
  return _buildCss(path, [
    cssImports,
    require('cssnano')({
      preset: ['default', {
        discardComments: { removeAll: true }
      }]
    }),
  ])
}

async function _buildCss (path: string, plugins: any[]) {
  const css = await new Promise<string>((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, content) => {
      if (err) return reject(err)
        else resolve(content)
    })
  })

  const result = await postcss(plugins)
    .process(css, {
      from: path,
      to: path.replace('/src/', '/dist/'), // TODO: Smartness
    })

  return result.css
}
