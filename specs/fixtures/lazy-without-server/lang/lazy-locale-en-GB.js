export default defineI18nLocale(async function (locale) {
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
})
