import '../_register-for-poc'
import {configureCookieSession} from 'solarjs/cookie-session'
import {server} from 'solarjs'

const session = configureCookieSession<{ visitCount?: number }>({
  secret: 'abc-example'
})

export default server(async r1 => {
  const r2 = session(r1)

  const count = r2.ctx.session.visitCount || 0
  r2.ctx.session.visitCount = count + 1

  return r2.send(`
    <!doctype html>
    <title>Cookies!</title>

    <h1>Cookie Session Example</h1>
    <p>You have visited this page ${count} times</p>
  `)
})
