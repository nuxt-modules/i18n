import { SWITCH_LOCALE_PATH_LINK_IDENTIFIER } from '#build/i18n.options.mjs'
import { useSwitchLocalePath, type Locale } from '#i18n'
import { defineNuxtLink } from '#imports'
import { Comment, defineComponent, h } from 'vue'
import { nuxtLinkDefaults } from '#build/nuxt.config.mjs'

import type { PropType } from 'vue'

const NuxtLink = defineNuxtLink({ ...nuxtLinkDefaults, componentName: 'NuxtLink' })

export default defineComponent({
  name: 'SwitchLocalePathLink',
  props: {
    locale: {
      type: String as PropType<Locale>,
      required: true
    }
  },
  inheritAttrs: false,
  setup(props, { slots, attrs }) {
    const switchLocalePath = useSwitchLocalePath()

    return () => [
      h(Comment, `${SWITCH_LOCALE_PATH_LINK_IDENTIFIER}-[${props.locale}]`),
      h(NuxtLink, { ...attrs, to: encodeURI(switchLocalePath(props.locale)) }, slots.default),
      h(Comment, `/${SWITCH_LOCALE_PATH_LINK_IDENTIFIER}`)
    ]
  }
})
