import { useLocalePath } from '#i18n'
import { defineComponent, computed, defineNuxtLink, h } from '#imports'

import type { PropType } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import type { RawLocation, RouteLocation } from '@intlify/vue-router-bridge'

const NuxtLinkLocale = defineNuxtLink({ componentName: 'NuxtLinkLocale' })

export default defineComponent({
  name: 'NuxtLinkLocale',
  props: {
    to: {
      type: [String, Object] as PropType<RawLocation | RouteLocation>,
      default: undefined,
      required: false
    },
    locale: {
      type: String as PropType<string>,
      default: undefined,
      required: false
    },

    // Default NuxtLink props
    href: {
      type: [String, Object] as PropType<RouteLocationRaw>,
      default: undefined,
      required: false
    },

    // Attributes
    target: {
      type: String as PropType<string>,
      default: undefined,
      required: false
    },
    rel: {
      type: String as PropType<string>,
      default: undefined,
      required: false
    },
    noRel: {
      type: Boolean as PropType<boolean>,
      default: undefined,
      required: false
    },

    // Prefetching
    prefetch: {
      type: Boolean as PropType<boolean>,
      default: undefined,
      required: false
    },
    noPrefetch: {
      type: Boolean as PropType<boolean>,
      default: undefined,
      required: false
    },

    // Styling
    activeClass: {
      type: String as PropType<string>,
      default: undefined,
      required: false
    },
    exactActiveClass: {
      type: String as PropType<string>,
      default: undefined,
      required: false
    },
    prefetchedClass: {
      type: String as PropType<string>,
      default: undefined,
      required: false
    },

    // Vue Router's `<RouterLink>` additional props
    replace: {
      type: Boolean as PropType<boolean>,
      default: undefined,
      required: false
    },
    ariaCurrentValue: {
      type: String as PropType<string>,
      default: undefined,
      required: false
    },

    // Edge cases handling
    external: {
      type: Boolean as PropType<boolean>,
      default: undefined,
      required: false
    },

    // Slot API
    custom: {
      type: Boolean as PropType<boolean>,
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

