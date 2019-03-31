import pathToRegexp, {Key} from 'path-to-regexp'
const urlJoin = require('url-join') as (a: string, b: string) => string

//
// Router
//
type ParamTypeMap = {
  str: string
  num: number
}
type ParamType = keyof ParamTypeMap

type ParamTypeToTS<T extends ParamType> = ParamTypeMap[T]

type ExtendRoute<T,R>
  = R extends Route<[]> ? Route<T> // Don't merge a route that has no parameters
  : R extends Route<infer U> ? Route<T & U>
  : R


export class Route<T> {
  private _c: Function
  private _re: RegExp
  private _re_p: RegExp
  private _keys: Key[]
  constructor(private _path: string, private _params: Record<string,string>={}) {
    this._keys = []
    this._re = pathToRegexp(this._path, this._keys)
    this._re_p = pathToRegexp(this._path, undefined, { end: false })
    this._c = pathToRegexp.compile(this._path)

    const targetKeys = Object.keys(_params)
    for (const key of this._keys) {
      if (typeof key.name === 'number') continue;
      const i = targetKeys.indexOf(key.name)
      if (i === -1) {
        throw new Error(`Param name found in route path string but not in param handlers: ':${key.name
          }'\n  for route path: ${this._path}`)
      }
      targetKeys.splice(i, 1)
    }

    if (targetKeys.length > 0) {
      throw new Error(`No such param for handler: '${targetKeys[0]}'\n  for route path: ${this._path}`)
    }
  }

  private _match(url: string, options?: { partial?: boolean }): T | null {
    const re = options && options.partial ? this._re_p : this._re
    let m = re.exec(url)
    if (! m) return null

    let matchedParams: any = {}

    for (let i = 0; i < this._keys.length; i++) {
      const key = this._keys[i]
      const param = m[i + 1]
      matchedParams[key.name] = decodeParam(param);
      if (this._params[key.name] === 'num') {
        matchedParams[key.name] = Number(matchedParams[key.name])
      }
      if (key.repeat) matchedParams[key.name] = matchedParams[key.name].split(key.delimiter)
    }
    return matchedParams
  }

  match(url: string) {
    return this._match(url)
  }

  match_p(url: string) {
    return this._match(url, { partial: true })
  }

  link(..._params: (T extends [] ? [] : [T])) {
    return this._c(_params)
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

  const route = new Route(path, params)

  const result: any = route

  if (children) {
    for (let key in children) {
      const childRoute = children[key] as any

      result[key] = new Route(
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

export const rpcRoute = route('/rpc/:proc', { proc: 'str' })
