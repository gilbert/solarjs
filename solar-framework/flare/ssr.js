"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const route_1 = require("solarjs/route");
const index_1 = require("./index");
const path_1 = require("path");
const preact_1 = require("preact");
const preact_render_to_string_1 = require("preact-render-to-string");
function renderPage(Page, props) {
    if (!Page.name || Page.name.match(/^default_/i)) {
        return `
      <!doctype html>
      <title>Error: No page name</title>
      <h1>Missing page function name</h1>
      <p>Please ensure your page function is named and not anonymous. For example:</p>
<pre>
export default function my_page () {
  return &lt;h1&gt;Hi!&lt;/h1&gt;
}
</pre>
      <p>Where <code>my_page</code> corresponds to a file named <code>client/pages/my_page.entry.ts</code></p>
    `;
    }
    const html = preact_render_to_string_1.render(preact_1.createElement(Page, props));
    const stylesheets = index_1.getStylesheets();
    return `
    <!doctype html>
    <title>${index_1.flushTitle()}</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" type="text/css" href="/assets/styles/global.entry.css">
    ${index_1.flushHead()}
    ${Object.keys(stylesheets).map(id => `<style data-id="${id}">${stylesheets[id]}</style>`).join('\n')}
    <div id="root">
      ${html}
    </div>
    <script>
      window.__PAGE_PROPS__ = ${JSON.stringify(props)}
    </script>
    <script src="/assets/pages/${Page.name}.entry.js"></script>
  `;
}
exports.renderPage = renderPage;
//
// Route match helper for convenience
//
function matchPage(r) {
    let m;
    if (m = r.match('GET', route_1.pagesRoute)) {
        const { pageName } = m;
        return {
            pageName,
            async bundlePage(pageDir) {
                const { bundlePage } = await Promise.resolve().then(() => __importStar(require('solar-dev/bundle-js')));
                const bundle = await bundlePage(path_1.normalize(pageDir + '/' + pageName));
                const result = await bundle.generate({ format: 'iife', name: 'Page' });
                return result.output[0].code;
            }
        };
    }
    return null;
}
exports.matchPage = matchPage;
