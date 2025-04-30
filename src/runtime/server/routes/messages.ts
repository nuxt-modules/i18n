import { defineEventHandler } from 'h3'
import { setResponseStatus } from 'h3'

export default defineEventHandler(async event => {
  const locale = event.context.params!.locale!
  if (!locale) {
    setResponseStatus(event, 400)
    return 'Locale is required'
  }

  await event.context.i18nLoadMessages(locale)
  return event.context.i18nCache?.[locale] ?? {}
})
