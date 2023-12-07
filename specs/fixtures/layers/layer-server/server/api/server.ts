export default defineEventHandler(async event => {
  const t = await useTranslation(event)
  const key = getQuery(event)?.key

  return {
    [key ?? 'key']: key ? t(key) : ''
  }
})
