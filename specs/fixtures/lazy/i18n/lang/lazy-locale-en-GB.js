export default defineI18nLocale(async function (locale) {
  const config = useRuntimeConfig()

  if (config.public.noServer) {
    return {
      html: '<span>This is the danger</span>',
      settings: {
        nest: {
          foo: {
            bar: {
              profile: 'Profile1'
            }
          }
        }
      }
    }
  }

  return $fetch(`/api/${locale}`)
})
