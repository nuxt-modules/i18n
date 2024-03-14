import { useSwitchLocalePath } from '#i18n'
import { Fragment, defineComponent, h } from 'vue'
import { defineNuxtLink } from '#imports'

import type { PropType } from 'vue'
import { Comment } from 'vue'

const NuxtLinkLocale = defineNuxtLink({ componentName: 'NuxtLinkLocale' })

export default defineComponent({
  name: 'SwitchLocalePathLink',
  props: {
    locale: {
      type: String as PropType<string>,
      required: true
    }
  },
  setup(props, { slots }) {
    const switchLocalePath = useSwitchLocalePath()

    return () =>
      h(Fragment, [
        h(Comment, 'nuxt-i18n-swlp'),
        h(NuxtLinkLocale, { to: switchLocalePath(props.locale), 'data-nuxt-i18n-swlp': props.locale }, slots.default),
        h(Comment, 'nuxt-i18n-swlp-end')
      ])
  }
})
