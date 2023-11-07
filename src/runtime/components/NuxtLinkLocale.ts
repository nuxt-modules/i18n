import { useLocalePath } from '#i18n'
import { defineComponent, computed, h } from 'vue'
import { defineNuxtLink } from '#imports'
import { hasProtocol } from 'ufo'

import type { PropType } from 'vue'
import type { NuxtLinkProps } from 'nuxt/app'

const NuxtLinkLocale = defineNuxtLink({ componentName: 'NuxtLinkLocale' })

export default defineComponent<NuxtLinkProps & { locale?: string; to: NuxtLinkProps['to'] }>({
  name: 'NuxtLinkLocale',
  props: {
    ...NuxtLinkLocale.props,
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

      return props.to === '' || props.to == null || hasProtocol(props.to, { acceptRelative: true })
    })

    /**
     * Get props to pass to NuxtLink
     * @returns NuxtLink props
     */
    const getNuxtLinkProps = () => {
      const _props = {
        ...props
      }

      if (!isExternal.value) {
        _props.to = resolvedPath.value
      }

      // The locale attribute cannot be set for NuxtLink
      // @see https://github.com/nuxt-modules/i18n/issues/2498
      delete _props.locale

      return _props
    }

    return () => h(NuxtLinkLocale, getNuxtLinkProps(), slots.default)
  }
})
