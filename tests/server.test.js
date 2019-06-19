const o = require('ospec')
const request = require('supertest')
const {bareServer, json, RequestError} = require('solarjs')
const {route} = require('solarjs/route')
const {rpc} = require('solarjs/server/rpc')
const procs = require('./fixtures').procs

const app = bareServer(async r => {
  if (r.url === '/1' && r.method === 'POST') return r.send('one more')
  if (r.url === '/1') return r.send('one')
  if (r.url === '/2') return r.send('two')

  if (r.match('GET', router.echoQuery)) return r.send(r.query)

  if (r.match('GET', router.abc)) return r.send('def')
  if (r.match_p('GET', router.abc)) return r.send('xyz')

  let m;
  if (m = r.match('GET', router.par)) return r.send(m)
  if (m = r.match_p('GET', router.par)) return r.send({ ...m, p: true })

  if (m = r.match('POST', router.par)) {
    const body = await r.json()
    return r.send({ ...m, ...body })
  }
  if (m = r.match_p('POST', router.parAlt)) {
    const body = await r.buffer()
    return r.send({ ...m, decoded: body.toString('base64') })
  }

  if (m = r.match('POST', router.rpc)) {
    const result = await procs[m.proc](await r.json())
    return r.send(result)
  }

  return r.send('bad')
})

const router = {
  abc: route('/abc'),
  par: route('/par/:x', { x: 'num' }),
  parAlt: route('/par-alt/:x', { x: 'num' }),
  rpc: route('/rpc/:proc', { proc: 'str' }),
  echoQuery: route('/echo-query'),
}

o.spec('Bare Server', function () {
  o.spec('basics', function () {
    o('url', async () => {
      const res1 = await request(app).get('/1')
      o(res1.text).equals('one')

      const res2 = await request(app).get('/2')
      o(res2.text).equals('two')
    })

    o('method', async () => {
      const res = await request(app).post('/1')
      o(res.text).equals('one more')
    })
  })

  o.spec('route', function () {
    o('match', async () => {
      const res1 = await request(app).get('/abc')
      o(res1.text).equals('def')
    })

    o('match partial', async () => {
      const res1 = await request(app).get('/abc/123')
      o(res1.text).equals('xyz')
    })

    o('match params', async () => {
      const res1 = await request(app).get('/par/10')
      o(JSON.parse(res1.text)).deepEquals({ x: 10 })
    })

    o('match partial params', async () => {
      const res1 = await request(app).get('/par/20/more/stuff')
      o(JSON.parse(res1.text)).deepEquals({ x: 20, p: true })
    })
  })

  o.spec('body parsing', function () {
    o('post json', async () => {
      const res = await request(app).post('/par/30').send({ a: 'A', b: 'B' })
      o(JSON.parse(res.text)).deepEquals({ x: 30, a: 'A', b: 'B' })
    })

    o('post buffer', async () => {
      const res = await request(app).post('/par-alt/40').send('hello')
      o(JSON.parse(res.text)).deepEquals({ x: 40, decoded: 'aGVsbG8=' })
    })

    o('bad json', async () => {
      const res = await request(app).post('/par/4').send('i am not json')
      o(res.status).equals(400)
      o(JSON.parse(res.text)).deepEquals({ error: 'invalid_json' })
    })
  })

  o.spec('helpers', function () {
    o('query', async () => {
      const res = await request(app).get('/echo-query?xs=10&y=20&xs=11').send('hmm')
      o(JSON.parse(res.text)).deepEquals({ xs: ['10','11'], y: ['20'] })
    })
  })

  o.spec('rpc errors', function () {
    o('bad params', async () => {
      const res = await request(app).post('/rpc/lack').send({ y: 20 })
      o(res.status).equals(400)
      const body = JSON.parse(res.text)
      o(body.error).equals('invalid_rpc_params')
      o(typeof body.data).equals('object')
    })

    o('runtime error', async () => {
      const res = await request(app).post('/rpc/throws').send({ x: -1 })
      o(res.status).equals(500)
      o(JSON.parse(res.text)).deepEquals({ error: 'unexpected_error', message: 'params.idontexist is not a function' })
    })
  })
})
