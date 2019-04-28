const o = require('ospec')
const {route} = require('solarjs/route')

o.spec('Route', function () {

  o.spec('match()', function () {
    o('basic', function () {
      const r = route('/page/:name', { name: 'str' })
      const m = r.match('/page/home')
      o(m).deepEquals({ name: 'home' })
    })

    o('multiple', function () {
      const r = route('/page/:name/section/:index', { name: 'str', index: 'num' })
      const m = r.match('/page/home/section/4')
      o(m).deepEquals({ name: 'home', index: 4 })
    })

    o.spec('nested no parameters', function () {
      let r;
      o.before(() => {
        r = route('/first', {}, {
          inner: route('/second')
        })
      })
      o('parent', () => {
        o(r.match('/first?x=1')).deepEquals({})
      })
      o('child', () => {
        o(r.inner.match('/first/second')).deepEquals({})
      })
      o('parent partial', function () {
        o(r.match_p('/first')).deepEquals({})
      })
    })

    o.spec('nested with parameters', function () {
      let r;
      o.before(() => {
        r = route('/page/:x', { x: 'num' }, {
          inner: route('/inner/:y', { y: 'str' })
        })
      })
      o('parent', () => {
        o(r.match('/page/8')).deepEquals({ x: 8 })
      })
      o('child', () => {
        o(r.inner.match('/page/2/inner/foo')).deepEquals({ x: 2, y: 'foo' })
      })
      o('parent partial', function () {
        o(r.match_p('/page/8/inner/10')).deepEquals({ x: 8 })
      })
    })
  })

  o.spec('link()', function () {
    let r;
    o.before(() => {
      r = route('/page/:x', { x: 'num' }, {
        inner: route('/inner/:y', { y: 'str' })
      })
    })
    o('parent', () => {
      o(r.link({ x: 8 })).deepEquals('/page/8')
    })
    o('child', () => {
      o(r.inner.link({ x: 2, y: 'foo' })).deepEquals('/page/2/inner/foo')
    })
  })

  o.spec('Error handling', function () {
    o('missing param handler', function () {})
    o('extra param handler', function () {})
    o('mismatched basic type', function () {})
    o('mismatched array type', function () {})
  })
})
