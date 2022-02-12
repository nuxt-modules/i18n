import { it, expect } from 'vitest'
import { generateLoaderOptions } from '../src/gen'

it('generateLoaderOptions', () => {
  expect(
    generateLoaderOptions({
      localeCodes: ['en', 'ja', 'fr'],
      localeInfo: [
        {
          code: 'en',
          path: './locales/en.json'
        }
      ],
      nuxtI18nOptions: {
        defaultLocale: 'en',
        vueI18n: {
          locale: 'en',
          fallbackLocale: 'en',
          messages: {
            en: { hello: 'Hello!' }
          }
        }
      }
    })
  ).toMatchSnapshot()
})
