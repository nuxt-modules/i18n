// Configure options specific to Vue I18n
export default defineI18nConfig(() => {
  const cfg = useRuntimeConfig()
  // console.log(cfg)
  return {
    messages: {
      en: {
        welcome: 'Hello!',
        test123: 'toot'
        // test: {
        //   ...cfg
        // }
      }
    }
  }
})
