const diff = require('nanomorph')
import html from 'nanohtml'
export {diff, html}

import {observe} from './observe'

let App = {
  comps: {} as Record<string, Self<any>>,
  root: (_state: any) => document.body as HTMLElement,
  raf: () => window.requestAnimationFrame,
  applyRender: applyRender,
}

export function getApp() { return App }
export function resetApp(opts: {
  raf: typeof window.requestAnimationFrame,
  applyRender: typeof applyRender,
}) {
  App = {
    comps: {},
    root: () => document.body,
    raf: () => opts.raf || window.requestAnimationFrame,
    applyRender: opts.applyRender || applyRender,
  }
}

function applyRender (id: string, newContent: HTMLElement) {
  if (id === 'root') {
    let root = document.createElement('div')
    root.setAttribute('id', 'root')
    root.append(newContent)
    newContent = root
  }
  diff(document.getElementById(id), newContent)
}

export function Page<Props>(
  Page: (props: Props) => HTMLElement,
  initialProps?: Props,
) {
  initialProps = initialProps || (window as any).FLARE_PROPS
  const props = observe(initialProps, [], _change => {
    render()
    return true
  })
  const render = createraf(() => {
    App.applyRender('root', Page(props))
  }, App.raf())

  render()
}


class Self<State> {
  private _state: any
  constructor(public id: string, private onStateChange: (self: Self<State>) => void) {}

  getState(initialState: State): State {
    if (this._state === undefined) {
      // TODO: DEEP COPY INITIAL STATE (maybe?)
      const onchange = createraf(() => this.onStateChange(this), App.raf())
      this._state = observe(initialState, [], _change => {
        onchange()
        return true
      })
    }
    return this._state
  }
  html (strings: TemplateStringsArray, ...keys: any[]) {
    return html`<div id=${this.id}>${html(strings, ...keys)}</div>`
  }
}

export function comp <Props, State>(
  Component: (self: Self<State>, props: Props) => HTMLElement,
) {
  return (key: string, props: Props) => {
    const id = `comp-${key}`
    if (! (id in App.comps)) {
      App.comps[id] = new Self<State>(id, (self) => {
        App.applyRender(self.id, Component(self, props))
      })
    }
    const html = Component(App.comps[id], props)
    return html
  }
}

//
// HTML doc helpers
//
export function getTitle() { return document.title }
export function setTitle(title: string) { document.title = title; return '' }

//
// CSS support
//
export function css(_id: string, _styles: string) {
  // Nothing to do
  return ""
}

//
// Taken from nanoraf; removed require('assert')
//
function createraf (render: (...args: any[]) => any, raf: (...args: any[]) => any) {

  if (!raf) raf = window.requestAnimationFrame
  var redrawScheduled = false
  var args = null as null | IArguments

  return function frame () {
    if (args === null && !redrawScheduled) {
      redrawScheduled = true

      raf(function redraw () {
        redrawScheduled = false

        var length = args!.length
        var _args = new Array(length)
        for (var i = 0; i < length; i++) _args[i] = args![i]

        render.apply(render, _args)
        args = null
      })
    }

    args = arguments
  }
}
