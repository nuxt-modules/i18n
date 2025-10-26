// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  srcDir: 'src/app/',
  i18n: {
    customRoutes: 'config',
    pages: {
      'custom-layer/[slug]': {
        en: '/custom-layer/[slug]',
        fr: '/custom-layer-french/[slug]',
      },
    },
  },
})
