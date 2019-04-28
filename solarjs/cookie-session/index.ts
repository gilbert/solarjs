import {Request} from '../server/bare-server'
import configure from 'cookie-session'

type Options = Parameters<typeof configure>[0]

/** Full docs: https://www.npmjs.com/package/cookie-session */
export function configureCookieSession<Session>(options: Options = {}) {
  if (! options.keys && ! options.secret) {
    options.secret = process.env.SESSION_SECRET
    if (! options.secret) {
      throw new Error('[solar][cookie-session] Please set SESSION_SECRET')
    }
  }

  const cookieSession = configure(options)
  return function setSession<T>(r: Request<'new', T>) {
    // cookie-session is synchronous so we don't have to worry about async
    cookieSession(r.req as any, r.dangerouslyGetRes() as any, () => {})
    return r.assign({ session: (r.req as any).session as Session })
  }
}
