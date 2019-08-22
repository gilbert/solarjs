import {Route} from '../route'

export type UnexpectedError = {
  type: 'error',
  code: 'unexpected',
  message?: string
  data?: any
}

type NoContextWithUnexpected<F> =
  F extends (params: infer T, ctx?: any) => infer U
  ? (params: T) => U | UnexpectedError
  : never

type CsrfOptions = {
  cookie?: string
  header?: string
}

export function makeRpcClient<T>(route: Route<{ proc: string }>, opts: { csrf?: CsrfOptions } = {}) {
  return new Proxy({}, {
    get(_, proc: string) {
      return rpc.bind(null, route.link({ proc }), opts.csrf || {}, proc)
    }
  }) as { [Proc in keyof T]: NoContextWithUnexpected<T[Proc]> }
}

async function rpc(endpoint: string, csrf: CsrfOptions, proc: string, arg: any) {
  console.log(`[rpc] ${proc}(${JSON.stringify(arg)})`)
  return window.fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      [csrf.header || 'x-csrf-token']: (document.cookie.match(new RegExp('(^| )' + (csrf.cookie || '_csrf') + '=([^;]+)')) || [])[2],
    },
    body: JSON.stringify(arg)
  })
    .then(async res => {
      const data = await res.json()
      if (res.status === 200) {
        return data
      }
      else {
        console.error(`[rpc][${proc}]`, data)
        throw new Error(`[rpc][${data.error}] ${data.message}`)
      }
    })
}
