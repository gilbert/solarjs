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

type Without<T, K> = Pick<T, Exclude<keyof T, K>>

type ExtendChildRoute<ParentT,ChildR>
  = ChildR extends Route<[]> ? Route<ParentT> /* Don't merge empty route params */ & { [k in keyof Without<ChildR, RouteKeys>]: ExtendChildRoute<ParentT, ChildR[k]> }
  : ChildR extends Route<infer ChildT> ? Route<ParentT & ChildT> & { [k in keyof Without<ChildR, RouteKeys>]: ExtendChildRoute<ParentT & ChildT, ChildR[k]> }
  : ChildR

type RouteKeys = keyof Route<[]>

export type Route<T> = {
  match: (url: string) => ParamsOrEmpty<T> | null
  match_p: (url: string) => ParamsOrEmpty<T> | null
  link: (..._params: (T extends [] ? [] : [T])) => string
}

type ParamsOrEmpty<T> = T extends [] ? {} : T

function createRoute(prefix: string, _path: string, _params: Record<string,string>, children: Record<string,Route<any>>): any {
  const _fullPath = urlJoin(prefix, _path)
  const _keys: Key[] = []
  const _re = pathToRegexp(_fullPath, _keys)
  const _re_p = pathToRegexp(_fullPath, undefined, { end: false })
  const _c = pathToRegexp.compile(_fullPath)

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

  function _match(url: string, options?: { partial?: boolean }) {
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

  const _children = {} as Record<string,Route<any>>

  for (let key in children) {
    const child = children[key] as any

    _children[key] = createRoute(
      _fullPath,
      child._path,
      { ..._params, ...child._params },
      child._children
    )
  }

  return Object.assign({
    match(url: string) {
      return _match(url)
    },
    match_p(url: string) {
      return _match(url, { partial: true })
    },
    link(..._params: any): string {
      return _c(..._params)
    },

    // Private! Only used for nested route construction
    _path, _fullPath, _params, _children,

  }, _children) // Extend here for dx
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
): Route<T> & { [K2 in keyof Children]: ExtendChildRoute<T, Children[K2]> }

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
  : Route<T> & { [K2 in keyof Children]: ExtendChildRoute<T, Children[K2]> }
{
  return createRoute('/', path, params || {}, (children as any) || {}) as any
}

function decodeParam(param: string) {
  try {
    return decodeURIComponent(param);
  } catch (_) {
    // throw createError(400, 'failed to decode param "' + param + '"');
    throw new Error('failed to decode param "' + param + '"');
  }
}

export let buildRoute  = route('/assets/build/:path+', { path: 'many' })
export let pagesRoute  = route('/assets/pages/:pageName(.+\\.entry\\.js)', { pageName: 'str' })
export let stylesRoute = route('/assets/styles/:entry(.+\\.entry\\.css)', { entry: 'str' })
export let publicRoute = route('/assets/public/:path+', { path: 'many' })
