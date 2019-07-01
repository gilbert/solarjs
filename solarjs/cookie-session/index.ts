import {Request} from '../server/bare-server'
import configure from 'cookie-session'

type Options = Parameters<typeof configure>[0]

/** Full docs: https://www.npmjs.com/package/cookie-session */
export function configureCookieSession<Session, Flash extends Record<any,any>>(options: Options = {}) {
  if (! options.keys && ! options.secret) {
    options.secret = process.env.SESSION_SECRET
    if (! options.secret) {
      throw new Error('[solar][cookie-session] Please set SESSION_SECRET')
    }
  }

  const cookieSession = configure({
    ...options,
    name: options.name || 'solar_session',
  })

  const ensureCookieMiddlewareHasBeenApplied = (r: Request<any,any>) => {
    const req = r.req as any
    if (! req.session) {
      // cookie-session is synchronous so we don't have to worry about async
      cookieSession(req, r.dangerouslyGetRes() as any, () => {})
      // Init now for consistency
      req.session.flash = {}
    }
  }

  return {
    get(r: Request<any, any>) {
      ensureCookieMiddlewareHasBeenApplied(r)

      // Close over req so session and flash are consistent across .set() calls
      const req = r.req as any

      const sessionWrapper = Object.create(req.session) as Session & {
        /** WARNING: This is destructive. Only call this once per request! */
        flash(): Flash
        flash<Key extends keyof Flash>(name: Key, value: Flash[Key]): void
      }

      sessionWrapper.flash = function (name?: any, value?: any) {
        if (name === undefined && value === undefined) {
          const temp = req.session.flash || {}
          req.session.flash = {}
          return temp
        }
        req.session.flash[name] = value
      }

      //
      // Wrap in proxy so userland can assign properties directly to session.
      // Not recommended, but still supported.
      //
      return new Proxy(sessionWrapper, {
        set(_obj, prop, value) {
          if (prop === 'flash') {
            console.warn("[session] Cannot set property 'flash'")
            return false
          }
          req.session[prop] = value
          return true
        }
      })
    },
    set(r: Request<any, any>, sessionData: Session) {
      ensureCookieMiddlewareHasBeenApplied(r)
      const req = r.req as any

      // Persist flash across all .set() calls
      const temp = req.session.flash
      req.session = sessionData
      req.session.flash = temp
    },
  }
}
