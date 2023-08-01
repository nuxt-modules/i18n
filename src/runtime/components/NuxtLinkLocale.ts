import { NuxtLink } from '#components'
import { useLocalePath } from '#i18n'
import { defineComponent, computed, defineNuxtLink, h } from '#imports'
import { hasProtocol } from 'ufo'

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

    // Resolving link type
    const isExternal = computed<boolean>(() => {
      // External prop is explicitly set
      if (props.external) {
        return true
      }

      // When `target` prop is set, link is external
      if (props.target && props.target !== '_self') {
        return true
      }

      // When `to` is a route object then it's an internal link
      if (typeof props.to === 'object') {
        return false
      }

      return props.to === '' || hasProtocol(props.to, { acceptRelative: true })
    })

    return () =>
      isExternal.value
        ? h(NuxtLink, props, slots.default)
        : h(NuxtLinkLocale, { ...props, to: resolvedPath }, slots.default)
  }
})
