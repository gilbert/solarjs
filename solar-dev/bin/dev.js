#!/usr/bin/env node
require('dotenv').config()

const cmd = process.argv[2] || 'server'
const cwd = process.cwd()

const config = require(cwd + '/dist/server/config')

if (cmd === 'build') {
  const path = require('path')
  const glob = require('util').promisify(require('glob'))
  const writeFile = require('util').promisify(require('fs').writeFile)
  const mkdir = require('util').promisify(require('fs').mkdir)

  const {bundlePageProd} = require('../bundle-js')
  const {buildCssProd} = require('../build-css')

  const inputJS = cwd + '/dist/client/pages/**/*.entry.js'
  const inputCSS = cwd + '/client/styles/**/*.entry.css'
  const outputDir = cwd + '/dist/client/_build'


  try {
    var build_id =
      process.env.SOURCE_VERSION || // for heroku
      getGitHeadCommitHash(cwd + '/.git')
  } catch(_) {}

  if (!build_id) {
    console.warn('[solar-dev] No build id. Skipping')
    process.exit(0)
  }

  go().catch(err => console.log('[solar-dev] Build failed:', err))

  async function go () {

    const jsFiles = await glob(inputJS)
    console.log(`[solar-dev] Building ${jsFiles.length} JS entry files...`)

    const bundle = await bundlePageProd(jsFiles, build_id)
    await bundle.write({
      format: 'esm',
      dir: outputDir,
    })
    // rollup creates the build folder for us
    await writeFile(outputDir + '/.build_id', build_id, 'utf8')

    const cssFiles = await glob(inputCSS)
    console.log(`[solar-dev] Building ${cssFiles.length} CSS entry files...`)

    await Promise.all(cssFiles.map(async file => {
      const dest = file.replace(`${cwd}/client/styles/`, `${cwd}/dist/client/_build/styles/`)
      await mkdir(path.dirname(dest), { recursive: true })
      await writeFile(dest, await buildCssProd(file), 'utf8')
    }))

    console.log('[solar-dev] Success! build_id:', build_id)
  }
}
else if (cmd !== 'server') {
  console.error('Unknown command:', cmd)
}
else {
  //
  // TODO: Use programamtic api to introduce HMR
  //
  process.argv = process.argv.slice(0,2).concat('dist/server/index.js', '-p', config.port)
  require(cwd + '/node_modules/micro-dev/bin/micro-dev')
}

function getGitHeadCommitHash (gitDir) {
  const fs = require('fs')
  const rev = fs.readFileSync(gitDir + '/HEAD').toString()
  if (rev.indexOf(':') === -1) {
    return rev
  } else {
    return fs.readFileSync(gitDir + '/' + rev.substring(5).trim()).toString().trim()
  }
}
