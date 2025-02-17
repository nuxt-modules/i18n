/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useLocaleRoute, type Locale } from '#i18n'
import { defineComponent, computed, h } from 'vue'
import { defineNuxtLink } from '#imports'
import { hasProtocol } from 'ufo'
import { nuxtLinkDefaults } from '#build/nuxt.config.mjs'

import type { PropType } from 'vue'
import type { NuxtLinkProps } from 'nuxt/app'

const NuxtLinkLocale = defineNuxtLink({ ...nuxtLinkDefaults, componentName: 'NuxtLinkLocale' })

type NuxtLinkLocaleProps = Omit<NuxtLinkProps, 'to'> & {
  to?: import('vue-router').RouteLocationNamedI18n
  locale?: Locale
}

export default defineComponent<NuxtLinkLocaleProps>({
  name: 'NuxtLinkLocale',

  props: {
    ...NuxtLinkLocale.props,
    locale: {
      type: String as PropType<Locale>,
      default: undefined,
      required: false
    }
  },
  setup(props, { slots }) {
    const localeRoute = useLocaleRoute()

    // From https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/components/nuxt-link.ts#L57
    const checkPropConflicts = (
      props: NuxtLinkLocaleProps,
      main: keyof NuxtLinkLocaleProps,
      sub: keyof NuxtLinkProps
    ): void => {
      if (import.meta.dev && props[main] !== undefined && props[sub] !== undefined) {
        console.warn(`[NuxtLinkLocale] \`${main}\` and \`${sub}\` cannot be used together. \`${sub}\` will be ignored.`)
      }
    }

    const resolvedPath = computed(() => {
      const destination = props.to ?? props.href
      return destination != null ? localeRoute(destination, props.locale) : destination
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

      return destination === '' || destination == null || hasProtocol(destination as string, { acceptRelative: true })
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
        // @ts-expect-error type needs to expanded to allow route objects/paths as NuxtLinkProps
        _props.to = resolvedPath.value
      }

      // Warn when both properties are used, delete `href` to prevent warning by `NuxtLink`
      checkPropConflicts(props, 'to', 'href')
      delete _props.href

      // The locale attribute cannot be set for NuxtLink
      // @see https://github.com/nuxt-modules/i18n/issues/2498
      delete _props.locale

      return _props as NuxtLinkProps
    }

    return () => h(NuxtLinkLocale, getNuxtLinkProps(), slots.default)
  }
})
