import pathToRegexp, {Key} from 'path-to-regexp'
const urlJoin = require('url-join') as (a: string, b: string) => string

//
// Router
//
type ParamTypeMap = {
  str: string
  num: number
  many: string[]
}
type ParamType = keyof ParamTypeMap

type ParamTypeToTS<T extends ParamType> = ParamTypeMap[T]

type ExtendRoute<T,R>
  = R extends Route<[]> ? Route<T> // Don't merge a route that has no parameters
  : R extends Route<infer U> ? Route<T & U>
  : R

export type Route<T> = {
  match: (url: string) => ParamsOrEmpty<T> | null
  match_p: (url: string) => ParamsOrEmpty<T> | null
  link: (..._params: (T extends [] ? [] : [T])) => string
}

type ParamsOrEmpty<T> = T extends [] ? {} : T

function createRoute<T>(_path: string, _params: Record<string,string>={}): Route<T> {
  const _keys: Key[] = []
  const _re = pathToRegexp(_path, _keys)
  const _re_p = pathToRegexp(_path, undefined, { end: false })
  const _c = pathToRegexp.compile(_path)

  const targetKeys = Object.keys(_params)
  for (const key of _keys) {
    if (typeof key.name === 'number') continue;
    const i = targetKeys.indexOf(key.name)
    if (i === -1) {
      throw new Error(`Param name found in route path string but not in param handlers: ':${key.name
        }'\n  for route path: ${_path}`)
    }
    targetKeys.splice(i, 1)
  }

  if (targetKeys.length > 0) {
    throw new Error(`No such param for handler: '${targetKeys[0]}'\n  for route path: ${_path}`)
  }

  function _match(url: string, options?: { partial?: boolean }): T | null {
    // Remove query string from url
    url = url.replace(/\?.*$/, '')
    const re = options && options.partial ? _re_p : _re
    let m = re.exec(url)
    if (! m) return null

    let matchedParams: any = {}

    for (let i = 0; i < _keys.length; i++) {
      const key = _keys[i]
      const param = m[i + 1]
      matchedParams[key.name] = decodeParam(param);
      if (_params[key.name] === 'num') {
        matchedParams[key.name] = Number(matchedParams[key.name])
      }
      if (key.repeat) matchedParams[key.name] = matchedParams[key.name].split(key.delimiter)
    }
    return matchedParams
  }

  return {
    match(url: string) {
      return _match(url)
    },
    match_p(url: string) {
      return _match(url, { partial: true })
    },
    link(..._params: (T extends [] ? [] : [T])): string {
      return _c(..._params as any)
    },

    // Do it this way to keep type info hidden from TypeScript
    ...{ _path, _params } as any
  }
}

export function route<_, Params, Children, T>(path: string): Route<[]>

export function route <
  P extends ParamType,
  Params extends { [_: string]: P },
  Children = unknown,
  T = { [K in keyof Params]: ParamTypeToTS<Params[K]> }
>(path: string, params: Params): Route<T>

export function route <
  P extends ParamType,
  Params extends { [_: string]: P }={},
  Children extends { [_: string]: Route<any> } | unknown = unknown,
  T = { [K in keyof Params]: ParamTypeToTS<Params[K]> }
>(
  path: string,
  params: Params,
  children: Children,
): Route<T> & { [K2 in keyof Children]: ExtendRoute<T, Children[K2]> }

export function route <
  P extends ParamType,
  Children extends { [_: string]: Route<any> } | unknown = unknown,
>(
  path: string,
  params: undefined,
  children: Children,
): Route<[]> & Children

export function route <
  P extends ParamType,
  Params extends { [_: string]: P }={},
  Children extends { [_: string]: Route<any> } | unknown = unknown,
  T = { [K in keyof Params]: ParamTypeToTS<Params[K]> }
>(
  path: string,
  params?: Params,
  children?: Children,
)
  : Route<T> & { [K2 in keyof Children]: ExtendRoute<T, Children[K2]> }
{

  const route = createRoute(path, params)

  const result: any = route

  if (children) {
    for (let key in children) {
      const childRoute = children[key] as any

      result[key] = createRoute(
        urlJoin(result._path, childRoute._path),
        { ...result._params, ...childRoute._params }
      )
    }
  }

  return result
}

function decodeParam(param: string) {
  try {
    return decodeURIComponent(param);
  } catch (_) {
    // throw createError(400, 'failed to decode param "' + param + '"');
    throw new Error('failed to decode param "' + param + '"');
  }
}

export let rpcRoute = route('/rpc/:proc', { proc: 'str' })
export let stylesRoute = route('/styles/:entry', { entry: 'str' })
export let publicRoute = route('/public/:path+', { path: 'many' })
