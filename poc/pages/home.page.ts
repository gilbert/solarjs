import { html, Page } from 'solarjs/flare'
import routes from '../routes'

type Props = {
  usernames: string[]
}

export default Page((props: Props) => html`
  <h1>Home Page</h1>
  <ul>
    ${props.usernames.map(username => html`
      <li><a href=${routes.user.link({ username })}>user ${username}</a></li>
    `)}

    <button
      onclick=${() => props.usernames.push('user-'+Math.random())}
    >Add random user</button>
  </ul>
`)
