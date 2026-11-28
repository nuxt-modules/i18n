export default defineNuxtRouteMiddleware((to) => {
  if ('useI18n' in to.query) {
    useI18n()
  }
})
