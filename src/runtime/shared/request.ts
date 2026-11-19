import { parse } from 'cookie-es'

/**
 * A request event from either h3 v1 (`event.headers`) or a web standard runtime (`event.req.headers`)
 */
export type RequestEventLike = object

function getRequestHeaders(event: RequestEventLike): Headers {
  const req = (event as { req?: { headers?: Headers } }).req
  return typeof req?.headers?.get === 'function' ? req.headers : (event as { headers: Headers }).headers
}

export function getRequestHeader(event: RequestEventLike, name: string): string | undefined {
  return getRequestHeaders(event).get(name) ?? undefined
}

export function getRequestCookie(event: RequestEventLike, name: string): string | undefined {
  return parse(getRequestHeader(event, 'cookie') || '')[name]
}

/**
 * The request host, preferring `x-forwarded-host`
 */
export function getRequestHost(event: RequestEventLike): string {
  return getRequestHeader(event, 'x-forwarded-host')?.split(',')[0]?.trim()
    || getRequestHeader(event, 'host')
    || 'localhost'
}

/**
 * The host the app is served on. Takes the event instead of using `useRequestURL()`, which finds
 * it through the ambient Nuxt app - that can be another request's during SSR (#4148)
 */
export function getHost(event: RequestEventLike | undefined): string {
  return import.meta.client ? window.location.host : getRequestHost(event!)
}
