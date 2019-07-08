"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//
// HTML doc helpers
//
let _title = '';
function flushTitle() {
    const temp = _title;
    return _title = '', temp;
}
exports.flushTitle = flushTitle;
function setTitle(title) {
    _title = title;
    return '';
}
exports.setTitle = setTitle;
let _head = '';
function flushHead() {
    const temp = _head;
    return _head = '', temp;
}
exports.flushHead = flushHead;
function addToHead(content) {
    _head += content;
    return '';
}
exports.addToHead = addToHead;
//
// CSS Support
//
let sheets = {};
function css(id, styles) {
    return {
        inject() {
            if (!sheets[id]) {
                sheets[id] = styles;
            }
            return "";
        }
    };
}
exports.css = css;
function getStylesheets() {
    const temp = sheets;
    return sheets = {}, temp;
}
exports.getStylesheets = getStylesheets;
