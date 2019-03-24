const micro = require('micro-dev/lib/serve')

export function startExample (path: string) {
  micro(path, {
    silent: false,
    host: '::',
    port: 3000,
    limit: '1mb',
    _: {}
  })
}
