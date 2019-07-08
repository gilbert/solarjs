import { h } from 'preact'
import { useState } from 'preact/hooks'
import routes from '../routes'
import { setTitle } from 'solar-framework/flare';

type Props = {
  usernames: string[]
}

export default function home (props: Props) {
  setTitle('Home')

  const [users, setUsers] = useState(props.usernames)

  return <div>
    <h1>Home Page</h1>
    <ul>
      {users.map(username =>
        <li><a href={routes.user.link({ username })}>user ${username}</a></li>
      )}

      <button
        onClick={() => setUsers(users.concat('user-'+Math.random()))}
      >Add random user</button>
    </ul>
  </div>
}
