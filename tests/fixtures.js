const {rpc, t} = require('solarjs/server/rpc')

exports.procs = {
  passthrough: rpc(
    t.type({ x: t.number, y: t.string }),
    async (params) => params
  ),

  extra: rpc(
    t.type({ x: t.number }),
    async (params) => params
  ),

  lack: rpc(
    t.type({ x: t.number }),
    async (params) => params
  ),

  throws: rpc(
    t.type({ x: t.number }),
    async (params) => params.idontexist()
  )
}
