import { useSwitchLocalePath, type Locale } from '#i18n'
import { defineNuxtLink, useNuxtApp } from '#imports'
import { Comment, computed, defineComponent, h } from 'vue'
import { nuxtLinkDefaults } from '#build/nuxt.config.mjs'

import type { PropType } from 'vue'

const NuxtLink = defineNuxtLink({ ...nuxtLinkDefaults, componentName: 'NuxtLink' })

const SlpComponent = defineComponent({
  name: 'SwitchLocalePathLink',
  props: {
    locale: {
      type: String as PropType<Locale>,
      required: true
    }
  },
  setup(props, { slots, attrs }) {
    const nuxtApp = useNuxtApp()
    const switchLocalePath = useSwitchLocalePath()

    const resolved = computed(() => {
      if (nuxtApp.isHydrating && Object.keys(window?._i18nSlp ?? {}).length && !window._i18nSlp?.[props.locale]) {
        return '#'
      }
      return encodeURI(switchLocalePath(props.locale)) || '#'
    })

    const disabled = computed(() => resolved.value === '#' || undefined)

    return () => h(NuxtLink, { ...attrs, to: resolved.value, 'data-i18n-disabled': disabled.value }, slots.default)
  }
})

export default defineComponent({
  name: 'SwitchLocalePathLinkWrapper',
  props: {
    locale: {
      type: String as PropType<Locale>,
      required: true
    }
  },
  inheritAttrs: false,
  setup(props, { slots, attrs }) {
    return () => [
      h(Comment, `${__SWITCH_LOCALE_PATH_LINK_IDENTIFIER__}-[${props.locale}]`),
      h(SlpComponent, { ...attrs, ...props }, slots.default),
      h(Comment, `/${__SWITCH_LOCALE_PATH_LINK_IDENTIFIER__}`)
    ]
  }
})
