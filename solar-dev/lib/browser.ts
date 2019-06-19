//
// HTML doc helpers
//
export function flushTitle() { return document.title }
export function setTitle(title: string) { document.title = title; return '' }

export function flushHead() { return document.title }
export function addToHead(_content: string) { return '' }

//
// CSS support
//

// Cache lookups not only for performance, but for more stringent behavior.
const cache: Record<string,boolean> = {}

export function css(id: string, styles: string) {
  return {
    //
    // During a client-side re-render, a component may render for the first time.
    // If that's the case, then these styles have not yet been added to the page.
    //
    inject() {
      if (id in cache) return

      const el = document.querySelector(`style[data-id="${id}"]`)
      if (!el) {
        const style = document.createElement('style')
        style.innerText = styles
        document.body.appendChild(style)
      }
      cache[id] = true
    }
  }
}
