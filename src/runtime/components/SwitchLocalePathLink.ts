import { useSwitchLocalePath } from '#i18n'
import { Comment, defineComponent, h } from 'vue'
import { defineNuxtLink } from '#imports'

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
      h(Comment, 'nuxt-i18n-swlp'),
      h(NuxtLink, { ...attrs, to: switchLocalePath(props.locale), 'data-nuxt-i18n-swlp': props.locale }, slots.default),
      h(Comment, '/nuxt-i18n-swlp')
    ]
  }
})
