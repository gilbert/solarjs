import html from 'nanohtml'

export {html}

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

//
// HTML doc helpers
//
let _title = ''
export function getTitle() {
  const temp = _title
  return _title = '', temp
}

export function setTitle (title: string) {
  _title = title
  return ''
}

//
// CSS Support
//
let sheets: Record<string,string> = {}

export function css(id: string, styles: string) {
  return {
    // Hack to handle interpolating within a nanohtml template
    get outerHTML() {
      if (! sheets[id]) {
        sheets[id] = styles
      }
      return ""
    }
  }
}
export function getStylesheets () {
  const temp = sheets
  return sheets = {}, temp
}
