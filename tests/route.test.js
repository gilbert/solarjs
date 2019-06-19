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

    o.spec('deep nested no parameters', function () {
      let r;
      o.before(() => {
        r = route('/dnp-0', undefined, {
          dnp1: route('/dnp-1', undefined, {
            dnp2: route('/dnp-2')
          })
        })
      })
      o('parent', () => {
        o(r.match('/dnp-0?x=1')).deepEquals({})
      })
      o('child', () => {
        o(r.dnp1.match('/dnp-0/dnp-1')).deepEquals({})
      })
      o('grandchild', () => {
        o(r.dnp1.dnp2.match('/dnp-0/dnp-1/dnp-2')).deepEquals({})
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

    o.spec('deep nested with parameters', function () {
      let r;
      o.before(() => {
        r = route('/dwp-0/:x', { x: 'num' }, {
          dwp1: route('/dwp-1/:y', { y: 'str' }, {
            dwp2: route('/dwp-2/:z', { z: 'num' })
          })
        })
      })
      o('parent', () => {
        o(r.match('/dwp-0/8')).deepEquals({ x: 8 })
      })
      o('child', () => {
        o(r.dwp1.match('/dwp-0/2/dwp-1/foo')).deepEquals({ x: 2, y: 'foo' })
      })
      o('grandchild', () => {
        o(r.dwp1.dwp2.match('/dwp-0/2/dwp-1/foo/dwp-2/4')).deepEquals({ x: 2, y: 'foo', z: 4 })
      })
      o('parent partial', function () {
        o(r.match_p('/dwp-0/8/dwp-1/10')).deepEquals({ x: 8 })
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
      o(r.link({ x: 8 })).equals('/page/8')
    })
    o('child', () => {
      o(r.inner.link({ x: 2, y: 'foo' })).equals('/page/2/inner/foo')
    })
  })

  o.spec('bindings', function () {
    let r;
    o.before(() => {
      r = route('/page/:x', { x: 'num' }, {
        inner: route('/inner/:y', { y: 'str' })
      })
    })
    o('parent', () => {
      const link = r.link
      o(link({ x: 10 })).equals('/page/10')
    })
    o('child', () => {
      const link = r.inner.link
      o(link({ x: 10, y: 'yy' })).equals('/page/10/inner/yy')
    })
  })

  o.spec('Error handling', function () {
    o('missing param handler', function () {})
    o('extra param handler', function () {})
    o('mismatched basic type', function () {})
    o('mismatched array type', function () {})
  })
})
