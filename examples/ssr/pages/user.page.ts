import { html, Page } from 'solarjs/flare'
import routes from '../routes'
import Hobbies from './components/Hobbies'

type User = {
  id: number
  username: string
  hobbies: string[]
}
type Props = {
  user: User | undefined
}

export default Page((props: Props) =>
  props.user === undefined ? notFound() :
  html`
    <h1>User: ${props.user.username}</h1>

    <p>This user has id ${props.user.id}</p>

    ${Hobbies('hobbies', { hobbies: props.user.hobbies })}

    <p><a href=${routes.home.link()}>Go Home</a></p>
  `)

function notFound () {
  return html`<h1>User not found.</h1>`
}
