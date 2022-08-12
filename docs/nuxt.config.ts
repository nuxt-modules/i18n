import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  extends: ['../node_modules/@docus/docs-theme'],

  modules: ['@docus/github'],

  github: {
    owner: 'nuxt-community',
    repo: 'i18n-module',
    branch: 'next'
  },

  tailwindcss: {
    // @ts-ignore
    config: {
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#d6ffee',
              100: '#acffdd',
              200: '#83ffcc',
              300: '#30ffaa',
              400: '#00dc82',
              500: '#00bd6f',
              600: '#009d5d',
              700: '#007e4a',
              800: '#005e38',
              900: '#003f25'
            }
            /*
            primary: {
              // DEFUALT: '#41B38A'
              DEFAULT: '#5468FF',
              50: '#d6ffee',
              100: '#acffdd',
              200: '#83ffcc',
              300: '#30ffaa',
              400: '#00dc82',
              500: '#00bd6f',
              600: '#009d5d',
              700: '#007e4a',
              800: '#005e38',
              900: '#003f25'
            }
            */
          }
        }
      }
    }
  }
})
