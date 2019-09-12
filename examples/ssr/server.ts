import {bareServer, RequestError, makeRenderPage, matchPage} from 'solar-framework'

import routes from './routes'
import homePage from './pages/home.page'
import userPage from './pages/user.page'

const renderPage = makeRenderPage(null)

export default bareServer(async r => {
  let m;
  if (r.match('GET', routes.home)) {
    const usernames = ['alice', 'bob']
    return r.send(renderPage(homePage, { usernames }))
  }
  else if (m = r.match('GET', routes.user)) {
    return r.send(renderPage(userPage, { user: USERS.get(m.username) }))
  }
  else if (m = matchPage(r)) {
    return r.send(await m.bundlePage(__dirname + '/pages'))
  }
  throw new RequestError(404, 'not_found')
})

let USERS = new Map(Object.entries({
  alice: { id: 10, username: 'alice', hobbies: ['JavaScript', 'Node.js'] },
  bob: { id: 20, username: 'bob', hobbies: ['Web Apps', 'SSR'] },
}))
