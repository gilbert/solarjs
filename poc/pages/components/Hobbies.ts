import { html, comp } from 'solarjs/flare'

type Props = {
  hobbies: string[]
}
type State = {
  open: boolean
}
export default comp<Props,State>((self, { hobbies }) => {
  const state = self.getState({ open: false })
  return self.html`
    ${state.open && html`
      <h3>Hobbies:</h3>
      <ul>
        ${hobbies.map(h => html`<li>${h}</li>`)}
      </ul>
    `}
      <button onclick=${() => {state.open = ! state.open}}>
        ${state.open ? 'Hide' : 'Show'} Hobbies
      </button>
    `
})
