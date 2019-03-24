const flags = { silent: false, host: '::', port: 3000, limit: '1mb', _: {} }
const micro = require('micro-dev/lib/serve')
micro(__dirname + '/server', flags)
