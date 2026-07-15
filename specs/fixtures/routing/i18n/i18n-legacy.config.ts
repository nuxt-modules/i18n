// @ts-ignore
export default defineI18nConfig(() => {
  return {
    legacy: true,
    messages: {
      en: {
        // global message shadowed by the component-local scope in `components/Legacy.vue` (#2315)
        hello: 'Hello world!'
      }
    }
  }
})
