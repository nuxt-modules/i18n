import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'module-experimental',
    configKey: 'moduleExperimental'
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // @ts-ignore
    nuxt.hook('i18n:registerModule', (register: any) => {
      register({
        // langDir path needs to be resolved
        langDir: resolver.resolve('./lang'),
        locales: [
          {
            name: 'Deutsch',
            code: 'de',
            language: 'de-DE',
            file: 'de.ts'
          },
          {
            code: 'en',
            language: 'en-US',
            file: 'en.ts'
          }
        ]
      })
    })
  }
})
