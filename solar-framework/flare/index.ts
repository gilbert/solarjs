import {stylesRoute} from 'solarjs/route'

//
// HTML doc helpers
//
let _title = ''
export function flushTitle() {
  const temp = _title
  return _title = '', temp
}

export function setTitle(title: string) {
  _title = title
  return ''
}


let _head = ''
export function flushHead() {
  const temp = _head
  return _head = '', temp
}

export function addToHead(content: string) {
  _head += content
  return ''
}

//
// CSS Support
//
let sheets: Record<string, string> = {}

export function css(id: string, styles: string) {
  return {
    inject() {
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

export function cssEntryPath(entry: string) {
  return stylesRoute.link({ entry })
}
