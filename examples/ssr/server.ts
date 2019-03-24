import '../_register-for-poc'
import {renderPage} from 'solarjs/flare'
import {matchEntryFile} from 'solarjs/flare/ssr'
import {server, RequestError} from 'solarjs'

import routes from './routes'
import homePage from './pages/home.page'
import userPage from './pages/user.page'


export default server(async r => {
  let m;
  if (r.match('GET', routes.home)) {
    const usernames = ['alice', 'bob']
    return r.send(renderPage(homePage, { usernames }, 'home.page.ts'))
  }
  else if (m = r.match('GET', routes.user)) {
    return r.send(renderPage(userPage, { user: USERS.get(m.username) }, 'user.page.ts'))
  }
  else if (m = matchEntryFile(r)) {
    return r.send(await m.bundle(__dirname + '/pages'))
  }
  throw new RequestError(404, 'not_found')
})

let USERS = new Map(Object.entries({
  alice: { id: 10, username: 'alice', hobbies: ['JavaScript', 'Node.js'] },
  bob: { id: 20, username: 'bob', hobbies: ['Web Apps', 'SSR'] },
}))
