import html from 'nanohtml'

export {html}

export function renderPage <Props>(
  Page: (props: Props) => HTMLElement,
  props: Props,
  src: string,
) {
  const html = Page(props)

  return `
    <div id="root">
      ${html}
    </div>
    <script>
      window.FLARE_PROPS = ${JSON.stringify(props)}
    </script>
    <script src="/entry/${src}"></script>
  `
}

export function Page<State>(
  Page: (state: State) => HTMLElement,
  _initialState: State = {} as any,
) {
  return Page
}

type Self<T> = {
  id: string
  getState(initialState: T): T
  html: (strings: TemplateStringsArray, ...keys: any[]) => ComponentRoot
}

type ComponentRoot = HTMLElement & { please_use_self_html: true }

export function comp <Props, State>(
  Component: (self: Self<State>, props: Props) => ComponentRoot,
) {
  return (key: string, props: Props) => {
    const id = `comp-${key}`
    return Component({
      id,
      getState(initialState: State) {
        return initialState
      },
      html(strings, ...keys) {
        return html`<div id=${id}>${html(strings, ...keys)}</div>` as ComponentRoot
      }
    }, props)
  }
}
