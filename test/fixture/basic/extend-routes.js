import { resolve } from 'path'

/** @type {import('@nuxt/types').Module} */
export default function () {
  // @ts-ignore
  this.extendRoutes(function (routes) {
    routes.push({
      name: 'custom-route-with-optional-slug',
      path: '/custom-route/:slug?',
      component: resolve(__dirname, 'pages/locale.vue')
    })
  })
}
