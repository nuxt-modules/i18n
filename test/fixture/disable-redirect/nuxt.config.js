import { resolve } from 'path'
import BaseConfig from '../base.config'

/** @type {import('@nuxt/types').NuxtConfig} */
const config = {
  ...BaseConfig,
  router: {
    trailingSlash: true
  },
  i18n: {
    prefixAndDefaultRule: 'default',
    strategy: 'prefix_and_default',
    locales: [
      {
        code: 'en',
        iso: 'en',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français'
      }
    ],
    defaultLocale: 'en'
  },
  buildDir: resolve(__dirname, '.nuxt'),
  srcDir: __dirname
}

module.exports = config
