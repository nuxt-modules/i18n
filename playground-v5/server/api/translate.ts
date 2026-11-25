import { defineEventHandler, getQuery } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const t = await useTranslation(event)
  const { key = 'welcome' } = getQuery<{ key?: string }>(event)

  return { [key]: t(key) }
})
