let counter = 0

export default defineI18nLocale(async function (locale) {
  const config = useRuntimeConfig()

  if (import.meta.client) {
    counter++
    console.log(`loading en-GB ${counter}`)
  }

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
