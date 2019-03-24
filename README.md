# SolarJS – A Radically Simple Server Framework

**Current status:** Proof of concept

Ideas:

- Express-style middleware is not worth their complexity
- REST is a poor abstraction
  - GraphQL is too much overhead
- Pages should be server-side rendered with a smooth transition to client-side rendering
- Pragmatic static typing gives maximum dev speed and maintainability

Implementations:

- A server is a function that returns a string
- Forget the restful api url ceremony and just expose functions instead
- Data-to-html page render functions that hydrate on browser for interactivity
- TypeScript

## Proof of Concept

Some of the above is implemented. What I need feedback most on is the SSR / client hydration code. Here's how it currently works from the user's perspective.

**Note:** This client-side framework is *not* designed to replace the more sophisticated ones like Mithril or React. Its goals are:

1. Ease of maintainability (typesafe rendering; template languages like mustache are a mess)
2. Use case coverage of "page with some interactivity"

With that said, this pattern might get you pretty far.

### Pages

From the user's perspective, they write a module to render a page. For example, here's a truncated version of the [SSR POC home page](./examples/ssr/pages/home.page.ts):

```ts
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
```

`props` is the entire page state. A page uses props to render to HTML on the server, which hydrates JS on the client.

Unlike react, changing props is **encouranged**. When any page prop changes, the entire page is re-rendered (kind of like [mithril](https://mithril.js.org)).

### Components

Like a page, a component renders to HTML on the server. However, a component holds onto internal state on the client.

For example, here is a [Hobbies component](./examples/ssr/pages/components/Hobbies.ts) where you can toggle a part of the page:

```ts
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
```

Interesting notes:

- Like before, changing props will re-render the page
- Changing **state** will only re-render this component
- The argument to `getState` is the initial state, which is only initialized once.

## Feedback

Ping me your thoughts at `@gilbert` on the [mithril channel](https://gitter.im/mithriljs/mithril.js)! :)
