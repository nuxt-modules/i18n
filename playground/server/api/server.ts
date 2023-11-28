export default defineEventHandler(async event => {
  const t = await useTranslation(event)
  return {
    hello: t('hello')
  }
})
