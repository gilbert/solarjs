import * as t from 'io-ts'
import {RequestError} from './index'
import {formatValidationError} from 'io-ts-reporters'

export {t} // Re-export for convenience

export function rpc<
  Params extends t.Type<any>,
  Proc extends (params: t.TypeOf<Params>, ctx?: any) => Promise<any>,
>(params: Params, proc: Proc): Proc
{
  const strictParams = t.exact(params as any)
  const safeProc: any = (clientArgs: t.TypeOf<Params>, ctx: any) => {
    const value = strictParams.decode(clientArgs).getOrElseL(errors => {
      throw new RpcInvalidParamsError(clientArgs, errors)
    })
    return proc(value, ctx)
  }
  return safeProc
}

export class RpcInvalidParamsError extends RequestError {
  constructor(public args: object, errors: t.Errors) {
    super(400, 'invalid_rpc_params', {
      details: errors.map(formatValidationError)
    })
  }
}
