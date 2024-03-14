import { SWITCH_LOCALE_PATH_LINK_IDENTIFIER } from '#build/i18n.options.mjs'
import { useSwitchLocalePath } from '#i18n'
import { defineNuxtLink } from '#imports'
import { Comment, defineComponent, h } from 'vue'

import type { PropType } from 'vue'

const NuxtLink = defineNuxtLink({ componentName: 'NuxtLink' })

export default defineComponent({
  name: 'SwitchLocalePathLink',
  props: {
    locale: {
      type: String as PropType<string>,
      required: true
    }
  },
  inheritAttrs: false,
  setup(props, { slots, attrs }) {
    const switchLocalePath = useSwitchLocalePath()

    return () => [
      h(Comment, SWITCH_LOCALE_PATH_LINK_IDENTIFIER),
      h(
        NuxtLink,
        {
          ...attrs,
          to: switchLocalePath(props.locale),
          [`data-${SWITCH_LOCALE_PATH_LINK_IDENTIFIER}`]: props.locale
        },
        slots.default
      ),
      h(Comment, `/${SWITCH_LOCALE_PATH_LINK_IDENTIFIER}`)
    ]
  }
})
