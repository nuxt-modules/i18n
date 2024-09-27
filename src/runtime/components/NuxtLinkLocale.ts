import { useLocalePath, type Locale } from '#i18n'
import { defineComponent, computed, h } from 'vue'
import { defineNuxtLink } from '#imports'
import { hasProtocol } from 'ufo'

import type { PropType } from 'vue'
import type { NuxtLinkProps } from 'nuxt/app'
import type { RouteLocationRawI18n } from 'vue-router'

const NuxtLinkLocale = defineNuxtLink({ componentName: 'NuxtLinkLocale' })

export default defineComponent<Omit<NuxtLinkProps, 'to'> & { to?: RouteLocationRawI18n; locale?: Locale }>({
  name: 'NuxtLinkLocale',
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- FIXME
  props: {
    ...NuxtLinkLocale.props,
    locale: {
      type: String as PropType<Locale>,
      default: undefined,
      required: false
    }
  },
  setup(props, { slots }) {
    const localePath = useLocalePath()

    // From https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/components/nuxt-link.ts#L57
    const checkPropConflicts = (props: NuxtLinkProps, main: keyof NuxtLinkProps, sub: keyof NuxtLinkProps): void => {
      if (import.meta.dev && props[main] !== undefined && props[sub] !== undefined) {
        console.warn(`[NuxtLinkLocale] \`${main}\` and \`${sub}\` cannot be used together. \`${sub}\` will be ignored.`)
      }
    }

    const resolvedPath = computed(() => {
      const destination = props.to ?? props.href
      return destination != null ? localePath(destination, props.locale) : destination
    })

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

      const destination = props.to ?? props.href
      // When `to` is a route object then it's an internal link
      if (typeof destination === 'object') {
        return false
      }

      return destination === '' || destination == null || hasProtocol(destination, { acceptRelative: true })
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

      // Warn when both properties are used, delete `href` to prevent warning by `NuxtLink`
      checkPropConflicts(props, 'to', 'href')
      delete _props.href

      // The locale attribute cannot be set for NuxtLink
      // @see https://github.com/nuxt-modules/i18n/issues/2498
      delete _props.locale

      return _props
    }

    return () => h(NuxtLinkLocale, getNuxtLinkProps(), slots.default)
  }
})
