import { type Locale, useSwitchLocalePath } from '#i18n'
import { defineNuxtLink, useNuxtApp } from '#imports'
import { Comment, computed, defineComponent, h, mergeProps } from 'vue'
import { hasProtocol } from 'ufo'
import { nuxtLinkDefaults } from '#build/nuxt.config.mjs'
import { useComposableContext } from '../composable-context'
import { useNuxtI18nContext } from '../context'

import type { PropType } from 'vue'

const NuxtLink = defineNuxtLink({ ...nuxtLinkDefaults, componentName: 'NuxtLink' })

const SlpComponent = defineComponent({
  name: 'SwitchLocalePathLink',
  props: {
    locale: {
      type: String as PropType<Locale>,
      required: true,
    },
  },
  setup(props, { slots, attrs }) {
    const nuxtApp = useNuxtApp()
    const payload = useComposableContext(nuxtApp).localePathPayload
    const switchLocalePath = useSwitchLocalePath(nuxtApp)

    const resolved = computed(() => {
      if (__I18N_STRICT_SEO__ && nuxtApp.isHydrating && Object.keys(payload ?? {}).length && !payload?.[props.locale]) {
        return '#'
      }
      // no encoding here - `switchLocalePath` returns an encoded path and vue escapes the attribute
      return switchLocalePath(props.locale) || (__I18N_STRICT_SEO__ && '#') || ''
    })

    const disabled = computed(() => (__I18N_STRICT_SEO__ && resolved.value === '#') || undefined)

    // the target recognizes an internal switch by its referer - NuxtLink's default `noreferrer`
    // and document-wide referrer policies would strip it, the explicit `origin` beats both
    const external = computed(() => hasProtocol(resolved.value, { strict: true }))
    // merged last so user handlers run first and cancelling the navigation skips the write;
    // the cookie records the choice where a spanning `cookieDomain` carries it to the target
    const onClick = (event: MouseEvent) =>
      __I18N_DOMAINS__
      && external.value
      && !disabled.value
      && !event.defaultPrevented
      && useNuxtI18nContext(nuxtApp).setCookieLocale(props.locale)

    return () =>
      h(
        NuxtLink,
        mergeProps(
          { rel: external.value ? 'noopener' : undefined, referrerpolicy: external.value ? 'origin' : undefined },
          attrs,
          { 'to': resolved.value, 'data-i18n-disabled': disabled.value, onClick },
        ),
        slots.default,
      )
  },
})

export default defineComponent({
  name: 'SwitchLocalePathLinkWrapper',
  props: {
    locale: {
      type: String as PropType<Locale>,
      required: true,
    },
  },
  inheritAttrs: false,
  setup(props, { slots, attrs }) {
    return () => [
      h(Comment, `${__SWITCH_LOCALE_PATH_LINK_IDENTIFIER__}-[${props.locale}]`),
      h(SlpComponent, { ...attrs, ...props }, slots.default),
      h(Comment, `/${__SWITCH_LOCALE_PATH_LINK_IDENTIFIER__}`),
    ]
  },
})
