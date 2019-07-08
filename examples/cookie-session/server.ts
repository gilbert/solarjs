import '../_register-for-poc'
import {configureCookieSession} from 'solarjs/cookie-session'
import {server} from 'solarjs/server'

const Session = configureCookieSession<{ visitCount?: number }, {}>({
  secret: 'abc-example'
})

export default server(async r => {
  const session = Session.get(r)

  const count = session.visitCount || 0
  session.visitCount = count + 1

  return r.send(`
    <!doctype html>
    <title>Cookies!</title>

    <h1>Cookie Session Example</h1>
    <p>You have visited this page ${count} times</p>
  `)
})
