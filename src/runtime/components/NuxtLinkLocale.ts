import { useLocalePath } from '#i18n'
import { defineComponent, computed, defineNuxtLink, h } from '#imports'

import type { PropType } from 'vue'
import type { RawLocation, RouteLocation } from '@intlify/vue-router-bridge'

const NuxtLinkLocale = defineNuxtLink({ componentName: 'NuxtLinkLocale' })

export default defineComponent({
  name: 'NuxtLinkLocale',
  props: {
    ...NuxtLinkLocale.props,
    to: {
      type: [String, Object] as PropType<RawLocation | RouteLocation>,
      default: undefined,
      required: false
    },
    locale: {
      type: String as PropType<string>,
      default: undefined,
      required: false
    }
  },
  setup(props, { slots }) {
    const localePath = useLocalePath()
    const resolvedPath = computed(() => (props.to != null ? localePath(props.to, props.locale) : props.to))

    return () => h(NuxtLinkLocale, { ...props, to: resolvedPath }, slots.default)
  }
})
