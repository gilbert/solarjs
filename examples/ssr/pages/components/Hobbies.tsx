import { h } from 'preact'
import { useState } from 'preact/hooks'

type Props = {
  hobbies: string[]
}
export default ({ hobbies }: Props) => {
  const [open, setOpen] = useState(false)
  return <div>
    {open &&
      <div>
        <h3>Hobbies:</h3>
        <ul>
          {hobbies.map(hobby => <li>{hobby}</li>)}
        </ul>
      </div>
    }
    <button onClick={() => setOpen(!open)}>
      {open ? 'Hide' : 'Show'} Hobbies
    </button>
  </div>
}
