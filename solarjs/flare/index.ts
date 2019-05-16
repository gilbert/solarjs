//
// HTML doc helpers
//
let _title = ''
export function getTitle() {
  const temp = _title
  return _title = '', temp
}

export function setTitle(title: string) {
  _title = title
  return ''
}

//
// CSS Support
//
let sheets: Record<string, string> = {}

export function css(id: string, styles: string) {
  return {
    // Hack to handle interpolating within a nanohtml template
    get outerHTML() {
      if (!sheets[id]) {
        sheets[id] = styles
      }
      return ""
    }
  }
}
export function getStylesheets() {
  const temp = sheets
  return sheets = {}, temp
}
