const {rpc, t} = require('solarjs/server/rpc')

//
// We don't need to test browser nanohtml,
// but we DO need to test browser comp dep calculations.
//
const {html} = require('solarjs/flare')
const {comp} = require('solar-dev/lib/browser')

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

exports.page = (state) => html`
  <div>
    ${state.a} + ${state.b} = <b>${state.a + state.b}</b>
  </div>
`

exports.pageWithComp = (state) => html`
  <style>
    body {
      background: #232323;
      color: whitesmoke;
    }
  </style>
  <input value="${state.num}" />
  <div>We got ${state.num} things up in hear</div>
  <h1>Hello</h1>
  noice
  ${exports.CommentForm('comment-form', state)}
`

exports.CommentForm = comp((self, { user, commentForm }) => html`
  <form
    id=${self.id}
    onsubmit=${e => {
      e.preventDefault()
      console.log("Submitting", e.target.username, commentForm.text)
    }}
  >
    <input name="name" type="text" value="${user.name}" />
    <textarea
      name="content"
      onchange=${e => { commentForm.text = e.target.value }}
    >${commentForm.text}</textarea>
  </form>
`)

exports.pageDeep = (state) => html`
  ${exports.A('a', {})}
`

exports.A = comp((self, attrs) => html`
  ${exports.B('b', {})}
`)

exports.B = comp((self, attrs) => html`
  <div id=${self.id}></div>
`)
