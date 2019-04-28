import * as t from 'io-ts'
import {RequestError} from './bare-server'

export {t} // Re-export for convenience

export function rpc<
  Params extends t.Type<any>,
  Proc extends (params: t.TypeOf<Params>) => Promise<any>,
>(params: Params, proc: Proc): Proc
{
  const strictParams = t.exact(params as any)
  const safeProc: any = (clientArgs: t.TypeOf<Params>) => {
    const value = strictParams.decode(clientArgs).getOrElseL((_errors: any) => {
      throw new RpcError(clientArgs, 'invalid_parameters')
    })
    return proc(value)
  }
  return safeProc
}

export class RpcError extends RequestError {
  constructor(public args: object, message: string) {
    super(400, message)
  }
}
