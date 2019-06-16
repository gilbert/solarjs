const o = require('ospec')
const {rpc, t, RpcError} = require('solarjs/server/rpc')
const procs = require('./fixtures').procs

o.spec('RPC', function () {
  o('accepts valid params', async () => {
    const args = { x: 10, y: 'hi' }
    o(await procs.passthrough(args)).deepEquals(args)
  })
  o('filters extra params', async () => {
    const args = { x: 10, y: 'hi' }
    o(await procs.extra(args)).deepEquals({ x: 10 })
  })
  o('rejects lacking params', async () => {
    const args = { y: 'hi' }
    try {
      await procs.lack(args)
      throw new Error('should not get here')
    }
    catch (err) {
      o(err.message).equals('invalid_rpc_params')
    }
  })
})
