"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("solarjs/server");
const ssr_1 = require("../flare/ssr");
const route_1 = require("solarjs/route");
const send_file_1 = require("./send-file");
const path_1 = __importDefault(require("path"));
const resolvePath = require('resolve-path');
/** A server with SSR, RPC, and cookie sessions */ 2;
function server(serverDir, handler) {
    const config = require(serverDir + '/config');
    const cssDir = path_1.default.join(serverDir, '../../client/styles');
    const pageDir = path_1.default.join(serverDir, '../client/pages');
    const publicDir = path_1.default.join(serverDir, '../../public');
    const _server = server_1.server(async (r) => {
        let m;
        if (m = ssr_1.matchPage(r)) {
            return r.send(await m.bundlePage(pageDir));
        }
        else if ((m = r.match('GET', route_1.stylesRoute))) {
            //
            // TODO: Implement production behavior
            //
            const { buildCss } = await Promise.resolve().then(() => __importStar(require('solar-dev/build-css')));
            const path = resolvePath(cssDir, m.entry);
            return r.setHeaders({ 'Content-Type': 'text/css' }).send(await buildCss(path));
        }
        else if (m = r.match('GET', route_1.publicRoute)) {
            return send_file_1.sendFile(r, m.path.join('/'), {
                root: publicDir,
                isDev: config.isDev,
            });
        }
        const r2 = await handler(r);
        if (!r2) {
            // TODO: 404.html
            throw new server_1.RequestError(404, 'not_found');
        }
        return r2;
    });
    return _server;
}
exports.server = server;
