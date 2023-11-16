export default defineEventHandler(event => {
  const t = useTranslation(event)
  return {
    hello: t('hello')
  }
})
