"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
//
// Originally based off koa-send
//
const server_1 = require("solarjs/server");
const fs = __importStar(require("fs"));
const resolvePath = require('resolve-path');
const path_1 = require("path");
async function sendFile(r1, path, opts = {}) {
    // options
    const root = opts.root ? path_1.normalize(path_1.resolve(opts.root)) : '';
    const trailingSlash = path[path.length - 1] === '/';
    path = path.substr(path_1.parse(path).root.length);
    const index = opts.index;
    const maxage = opts.maxAge || 0;
    const immutable = opts.immutable || false;
    const hidden = opts.hidden || false;
    const format = opts.format !== false;
    const extensions = Array.isArray(opts.extensions) ? opts.extensions : false;
    const brotli = opts.brotli !== false;
    const gzip = opts.gzip !== false;
    const setHeaders = opts.setHeaders;
    // normalize path
    try {
        path = decodeURIComponent(path);
    }
    catch (err) {
        throw new server_1.RequestError(400, '[send-file] failed to decode');
    }
    // index file support
    if (index && trailingSlash)
        path += index;
    path = resolvePath(root, path);
    // hidden file support, ignore
    if (!hidden && isHidden(root, path)) {
        throw new server_1.RequestError(404, 'not_found', opts.isDev ? { is_hidden: true } : undefined);
    }
    let encodingExt = '';
    // serve brotli file when possible otherwise gzipped file when possible
    let r2;
    // Require here for lazy loading
    const preferredEncodings = require('negotiator/lib/encoding');
    const acceptsEncodings = (es) => preferredEncodings(r1.req.headers["accept-encoding"], es);
    if (acceptsEncodings(['br', 'identity']) === 'br' && brotli && (await exists(path + '.br'))) {
        path = path + '.br';
        r2 = r1.setHeaders({ 'Content-Encoding': 'br', 'Content-Length': undefined });
        encodingExt = '.br';
    }
    else if (acceptsEncodings(['gzip', 'identity']) === 'gzip' && gzip && (await exists(path + '.gz'))) {
        path = path + '.gz';
        r2 = r1.setHeaders({ 'Content-Encoding': 'gzip', 'Content-Length': undefined });
        encodingExt = '.gz';
    }
    if (extensions && !/\.[^/]*$/.exec(path)) {
        const list = [].concat(extensions);
        for (let i = 0; i < list.length; i++) {
            let ext = list[i];
            if (typeof ext !== 'string') {
                throw new TypeError('option extensions must be array of strings or false');
            }
            if (!/^\./.exec(ext))
                ext = '.' + ext;
            if (await exists(path + ext)) {
                path = path + ext;
                break;
            }
        }
    }
    // stat
    let stats;
    try {
        stats = await stat(path);
        // Format the path to serve static file servers
        // and not require a trailing slash for directories,
        // so that you can do both `/directory` and `/directory/`
        if (stats.isDirectory()) {
            if (format && index) {
                path += '/' + index;
                stats = await stat(path);
            }
            else {
                throw new server_1.RequestError(404, 'not_found');
            }
        }
    }
    catch (err) {
        if (err instanceof server_1.RequestError) {
            throw err;
        }
        const notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR'];
        if (notfound.includes(err.code)) {
            throw new server_1.RequestError(404, 'not_found', opts.isDev ? { err } : undefined);
        }
        err.status = 500;
        throw err;
    }
    const r3 = setHeaders ? setHeaders(r2 || r1, path, stats) : (r2 || r1);
    // stream
    const finalHeaders = {};
    finalHeaders['Content-Length'] = '' + stats.size;
    if (!r3.responseHeaders['Last-Modified']) {
        finalHeaders['Last-Modified'] = stats.mtime.toUTCString();
    }
    if (!r3.responseHeaders['Cache-Control']) {
        const directives = ['max-age=' + (maxage / 1000 | 0)];
        if (immutable) {
            directives.push('immutable');
        }
        finalHeaders['Cache-Control'] = directives.join(',');
    }
    finalHeaders['Content-Type'] = type(path, encodingExt);
    return r3.setHeaders(finalHeaders).send(fs.createReadStream(path));
}
exports.sendFile = sendFile;
/**
 * Check if it's hidden.
 */
function isHidden(root, path) {
    const paths = path.substr(root.length).split(path_1.sep);
    for (let i = 0; i < paths.length; i++) {
        if (paths[i][0] === '.')
            return true;
    }
    return false;
}
/**
 * File type.
 */
function type(file, ext) {
    // Require here for lazy loading
    const getType = require('cache-content-type');
    return getType(ext !== '' ? path_1.extname(path_1.basename(file, ext)) : path_1.extname(file));
}
function exists(path) {
    return new Promise((resolve) => {
        fs.exists(path, resolve);
    });
}
function stat(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(stats);
            }
        });
    });
}
