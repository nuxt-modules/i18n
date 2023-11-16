import type { H3Event } from 'h3'

export default function (event: H3Event): string {
  return getQueryLocale(event).toString()
}
