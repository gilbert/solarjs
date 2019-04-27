//
// Configuration helpers
//
/**
 * Reads a key from `process.env`.
 * Throws an error if value is `undefined` or an empty string.
 **/
export function read<T>(
  /** The key to read from process.env */
  key: string
): string
export function read<T>(
  /** The key to read from `process.env` */
  key: string,
  /** Defaults to this value if the read value is `undefined` or empty string. */
  defaultValue: string,
): string
export function read<T>(
  /** The key to read from process.env */
  key: string,
  /** Convert your string value to whatever you want */
  parse: (val: string) => T,
): T
export function read<T>(
  /** The key to read from process.env */
  key: string,
  /** Defaults to this value if the read value is `undefined` or empty string */
  defaultValue: string,
  /** Convert your string value to whatever you want */
  parse: (val: string) => T,
): T

export function read<T>(
  key: string,
  _defaultValue?: string | ((val: string) => T),
  _parse?: (val: string) => T,
) {
  const [defaultValue, parse] = (function () {
    if (typeof _defaultValue === 'function') {
      return [undefined, _defaultValue] as const
    }
    else if (typeof _parse === 'function') {
      return [_defaultValue, _parse] as const
    }
    else if (_defaultValue) {
      return [_defaultValue, undefined] as const
    }
    else {
      return [undefined, undefined] as const
    }
  })()

  const val = process.env[key]
  if (val === undefined || val === '') {
    if (defaultValue !== undefined) {
      // Since value is unset, set it here so 3rd party
      // code can read default value
      process.env[key] = defaultValue

      return parse ? parse(defaultValue) : defaultValue
    }
    throw new Error(`[config] Please set ${key}`)
  }
  return parse ? parse(val) : val
}

export function Env<E extends string, Envs extends E[]>(validEnvs: Envs) {
  type Env = Envs[number]
  const env = validEnvs.find(env => env === read('NODE_ENV', 'development'))
  if (!env) {
    throw new Error('blah')
  }
  return {
    name: env as Env,
    branch<T>(options: Record<Env, T | ((env: Env) => T)>): T {
      const v = options[env]
      if (typeof v === 'function') {
        return v(env)
      }
      else return v as any
    },

    branchd<T>(defaultValue: T, options: Partial<Record<Env, T | ((env: Env) => T)>>): T {
      if (!(env in options)) {
        return defaultValue
      }
      const v = options[env]
      if (typeof v === 'function') {
        return v(env)
      }
      else return v as any
    }
  }
}
