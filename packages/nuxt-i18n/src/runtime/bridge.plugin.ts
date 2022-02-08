import Vue from 'vue'
import VueI18n from 'vue-i18n'
import VueRouter from 'vue-router'
import { createI18n, VERSION as BRIDGE_VERSION } from 'vue-i18n-bridge'
import { createRouter, localizeRoutes, VERSION as ROUTING_VERSION } from 'vue-i18n-routing'

// @ts-ignore
export default async function (nuxt, inject) {
  // @ts-ignore
  console.log(
    'bridge.plugin setup',
    nuxt,
    Vue.version,
    VueRouter.version,
    VueI18n.version,
    BRIDGE_VERSION,
    ROUTING_VERSION
  )

  // vue-i18n install to vue
  Vue.use(VueI18n, { bridge: true })

  const i18n = createI18n(
    {
      locale: 'en',
      legacy: false,
      globalInjection: true,
      messages: {
        en: {
          hello: 'Hello world!'
        }
      }
    },
    VueI18n
  )
  // console.log('i18n instance', i18n, i18n.global.t('hello'))
  Vue.use(i18n)

  inject('i18n', i18n)

  // NOTE: inject
  //  workaround for cannot extend to Vue.prototype on client-side ...
  //  We need to find out why we can't do that on the client-side.
  if (i18n.mode === 'composition' && process.client) {
    const composer = i18n.global
    inject('t', (...args: unknown[]) => Reflect.apply(composer.t, composer, [...args]))
    inject('d', (...args: unknown[]) => Reflect.apply(composer.d, composer, [...args]))
    inject('n', (...args: unknown[]) => Reflect.apply(composer.n, composer, [...args]))
  }
}
