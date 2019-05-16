import { h } from 'preact'
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

export default function user (props: Props) {
  return props.user === undefined ? notFound() :
  <div>
    <h1>User: {props.user.username}</h1>

    <p>This user has id {props.user.id}</p>

    <Hobbies hobbies={props.user.hobbies} />

    <p><a href={routes.home.link()}>Go Home</a></p>
  </div>
}

function notFound () {
  return <h1>User not found.</h1>
}
