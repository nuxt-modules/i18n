export default defineEventHandler(event => {
  return { initialized: event.context.nuxtI18n != null }
})
