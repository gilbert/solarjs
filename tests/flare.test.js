const o = require('ospec')
const {html} = require('solarjs/flare')
const {renderPage, comp, getApp, resetApp, Page} = require('solar-dev/lib/browser')
const fixt = require('./fixtures')
const raf = require('raf')

o.spec('Flare', function () {

  o.beforeEach(function () {
    resetApp({ raf })
  })

  o.spec('state', function () {

    o('uses state', () => {
      const state = { a: 10, b: 20, c: 50 }
      const result = fixt.page(state)

      o(result.indexOf('10 + 20 = <b>30</b>') > 0).equals(true)
    })

    o('uses state in nested components', () => {
      const state = { num: 10, user: { name: 'Alice' }, commentForm: { text: '' } }
      const result = fixt.pageWithComp(state)

      o(result.indexOf('<input name="name" type="text" value="Alice" />') > 0).equals(true)
    })
  })

  o.spec('comp', function () {
    o('state', async () => {
      resetApp({ raf, applyRender: () => {} })
      let onclick;
      let result;
      const Counter = comp((self, attrs) => {
        const state = self.getState({ count: attrs.initialCount })

        onclick = () => state.count += 1;
        result = html`
          <div id=${self.id} onclick=${onclick}>
            <b>Count: ${state.count}</b>
          </div>
        `
      })
      Counter('counter', { initialCount: 5 })
      o(result.indexOf('<b>Count: 5</b>') > 0).equals(true)

      onclick()
      await tick()
      o(result.indexOf('<b>Count: 6</b>') > 0).equals(true)
    })
  })

  o.spec('init', function () {

    let pageHtml, s1_html, s2_html;

    o.beforeEach(function () {
      pageHtml = undefined; s1_html = undefined; s2_html = undefined
      resetApp({
        raf,
        applyRender(id, content) {
          if (id === 'root') pageHtml = content
          if (id === 'comp-s1') s1_html = content
          if (id === 'comp-s2') s2_html = content
        }
      })
    })

    o('app state redraws', async () => {
      const state = { score: 50 }
      const ScoreDisplay = comp((self, { score }) => html`
        <b id=${self.id}>Score: ${score}</b>
      `)
      let inc
      const PageComponent = (state) => {
        inc = () => state.score += 50
        return html`
          ${ScoreDisplay('s1', { score: state.score })}
          ${ScoreDisplay('s2', { score: state.score })}
          <b>Score: ${state.score}</b>
        `
      }
      Page(PageComponent, state)

      await tick()

      o(pageHtml.indexOf('<b id="comp-s1">Score: 50</b>') > 0).equals(true)
      o(pageHtml.indexOf('<b id="comp-s2">Score: 50</b>') > 0).equals(true)
      o(pageHtml.indexOf('<b>Score: 50</b>') > 0).equals(true)

      inc()
      await tick()

      o(pageHtml.indexOf('<b id="comp-s1">Score: 100</b>') > 0).equals(true)
      o(pageHtml.indexOf('<b id="comp-s2">Score: 100</b>') > 0).equals(true)
      o(pageHtml.indexOf('<b>Score: 100</b>') > 0).equals(true)
    })

    o('comp state redraws', async () => {
      let inc = {}

      const state = { score: 50 }
      const ScoreDisplay = comp((self, { initialScore }) => {
        const state = self.getState({ score: initialScore })
        inc[self.id] = () => state.score += 50
        return html`
          <b id=${self.id}>Score: ${state.score}</b>
        `
      })
      const PageComponent = (state) => {
        inc.root = () => state.score += 50
        return html`
          ${ScoreDisplay('s1', { initialScore: state.score })}
          ${ScoreDisplay('s2', { initialScore: state.score })}
          <b>Score: ${state.score}</b>
        `
      }
      Page(PageComponent, state)

      await tick()

      o(pageHtml.indexOf('<b id="comp-s1">Score: 50</b>') > 0).equals(true)
      o(pageHtml.indexOf('<b id="comp-s2">Score: 50</b>') > 0).equals(true)
      o(pageHtml.indexOf('<b>Score: 50</b>') > 0).equals(true)
      o(s1_html).equals(undefined)
      o(s2_html).equals(undefined)

      const snapshot = pageHtml
      inc['comp-s1']()
      await tick()

      o(snapshot).equals(pageHtml)
      o(s1_html.indexOf('<b id="comp-s1">Score: 100</b>') > 0).equals(true)
      o(s2_html).equals(undefined)

      inc['comp-s2']()
      await tick()

      o(snapshot).equals(pageHtml)
      o(s1_html.indexOf('<b id="comp-s1">Score: 100</b>') > 0).equals(true)
      o(s2_html.indexOf('<b id="comp-s2">Score: 100</b>') > 0).equals(true)
    })
  })
})

function tick () {
  return new Promise(resolve => raf(resolve))
}
