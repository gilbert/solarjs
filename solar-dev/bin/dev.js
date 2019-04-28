#!/usr/bin/env node

var config = require(process.cwd() + '/dist/server/config')

//
// TODO: Use programamtic api to introduce HMR
//
process.argv.push('dist/server/index.js', '-p', config.port)
require(process.cwd() + '/node_modules/micro-dev/bin/micro-dev')
