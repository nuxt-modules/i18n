import { useTranslation } from '@intlify/h3'

export default defineEventHandler(async event => {
  const t = await useTranslation(event)

  return t('home')
})
