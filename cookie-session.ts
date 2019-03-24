import {Request} from './server/server'
import configure from 'cookie-session'

type Options = Parameters<typeof configure>[0]

/** Full docs: https://www.npmjs.com/package/cookie-session */
export function configureCookieSession<Session>(options?: Options) {
  const cookieSession = configure(options)
  return function setSession<T>(r: Request<'new', T>) {
    // cookie-session is synchronous so we don't have to worry about async
    cookieSession(r.req as any, r.dangerouslyGetRes() as any, () => {})
    return r.assign({ session: (r.req as any).session as Session })
  }
}
