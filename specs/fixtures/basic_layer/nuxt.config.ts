import pathe from 'pathe'
import { resolveFiles } from '@nuxt/kit'
// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  //   extends: ['./layer'],
  modules: [
    '@nuxtjs/i18n'
    // async (_, nuxt) => {
    //   const layers = nuxt.options._layers
    //   //   @ts-ignore
    //   console.log(
    //     (
    //       await Promise.all(
    //         layers
    //           .filter(x => x.config?.i18n?.langDir != null)
    //           .map(layer =>
    //             resolveFiles(
    //               pathe.resolve(layer.config.rootDir, layer.config!.i18n!.langDir),
    //               '**/*{json,json5,yaml,yml}'
    //             )
    //           )
    //       )
    //     ).flat()
    //   )
    // }
  ],
  debug: false,
  i18n: {
    debug: false,
    lazy: true,
    langDir: 'lang',
    defaultLocale: 'en',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.json',
        name: 'English'
      },
      {
        code: 'en-GB',
        iso: 'en-GB',
        file: 'en-GB.json',
        name: 'English'
      }
    ]
    //   locale: 'en',
    //   messages: {
    //     fr: {
    //       welcome: 'Bienvenue',
    //       home: 'Accueil',
    //       profile: 'Profil'
    //     },
    //     en: {
    //       welcome: 'Welcome',
    //       home: 'Homepage',
    //       profile: 'Profile'
    //     }
    //   }
    // }
  }
})
