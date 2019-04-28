import postcss from 'postcss'
import * as fs from 'fs'
const cssImports = require('postcss-import')

export async function buildCss (path: string) {
  const css = await new Promise<string>((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, content) => {
      if (err) return reject(err)
        else resolve(content)
    })
  })

  const result = await postcss([cssImports])
    .process(css, {
      from: path,
      to: path.replace('/src/', '/dist/'), // TODO: Smartness
    })

  return result.css
}
