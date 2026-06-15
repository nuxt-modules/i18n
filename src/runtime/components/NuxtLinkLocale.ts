import { isObject } from '@intlify/shared'
import { type Locale, useLocaleRoute } from '#i18n'
import { computed, defineComponent, h } from 'vue'
import { NuxtLink } from '#components'
import { hasProtocol } from 'ufo'

import type {
  AllowedComponentProps,
  AnchorHTMLAttributes,
  DefineSetupFnComponent,
  PropType,
  SlotsType,
  UnwrapRef,
  VNode,
  VNodeProps,
} from 'vue'
import type { NuxtApp, NuxtLinkProps } from 'nuxt/app'
import type { RouteLocation, UseLinkReturn } from 'vue-router'

type NuxtLinkLocaleProps<CustomProp extends boolean = false> = Omit<NuxtLinkProps<CustomProp>, 'to'> & {
  to?: import('vue-router').RouteLocationRaw
  locale?: Locale
}

// Mirrors `NuxtLink`'s slot props, which Nuxt does not export from `nuxt/app` (#3883).
// https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/components/nuxt-link.ts
type NuxtLinkLocaleSlotProps<CustomProp extends boolean = false> = CustomProp extends true
  ? {
      href: string
      navigate: (e?: MouseEvent) => Promise<void>
      prefetch: (nuxtApp?: NuxtApp) => Promise<void>
      route: (RouteLocation & { href: string }) | undefined
      rel: string | null
      target: '_blank' | '_parent' | '_self' | '_top' | (string & {}) | null
      isExternal: boolean
      isActive: false
      isExactActive: false
    }
  : UnwrapRef<UseLinkReturn>

type NuxtLinkLocaleSlots<CustomProp extends boolean = false> = {
  default?: (props: NuxtLinkLocaleSlotProps<CustomProp>) => VNode[]
}

const NuxtLinkLocaleImpl = defineComponent<NuxtLinkLocaleProps<boolean>>({
  name: 'NuxtLinkLocale',
  props: {
    ...NuxtLink.props,
    locale: {
      type: String as PropType<Locale>,
      default: undefined,
      required: false,
    },
  },
  setup(props, { slots }) {
    const localeRoute = useLocaleRoute()

    // From https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/components/nuxt-link.ts#L57
    function checkPropConflicts(
      props: NuxtLinkLocaleProps<boolean>,
      main: keyof NuxtLinkLocaleProps,
      sub: keyof NuxtLinkProps,
    ) {
      if (import.meta.dev && props[main] !== undefined && props[sub] !== undefined) {
        console.warn(`[NuxtLinkLocale] \`${main}\` and \`${sub}\` cannot be used together. \`${sub}\` will be ignored.`)
      }
    }

    // Lazily check whether to.value has a protocol
    const isAbsoluteUrl = computed(() => {
      const path = props.to || props.href || ''
      return typeof path === 'string' && hasProtocol(path, { acceptRelative: true })
    })

    const resolvedPath = computed(() => {
      const destination = props.to ?? props.href
      const resolved = destination != null ? localeRoute(destination, props.locale) : destination
      if (resolved && isObject(props.to)) {
        resolved.state = props.to?.state
      }

      return destination != null ? resolved : destination
    })

    // Resolving link type
    const isExternal = computed<boolean>(() => {
      // External prop is explicitly set
      if (props.external) {
        return true
      }

      const path = props.to || props.href || ''
      // When `to` is a route object then it's an internal link
      if (isObject(path)) {
        return false
      }

      return path === '' || isAbsoluteUrl.value
    })

    /**
     * Get props to pass to NuxtLink
     * @returns NuxtLink props
     */
    const getNuxtLinkProps = () => {
      const _props = {
        ...props,
      }

      if (!isExternal.value) {
        _props.to = resolvedPath.value
      }

      // Warn when both properties are used, delete `href` to prevent warning by `NuxtLink`
      checkPropConflicts(props, 'to', 'href')
      delete _props.href

      // Remove attributes not supported by NuxtLink (#2498)
      delete _props.locale

      return _props as NuxtLinkProps<boolean>
    }

    return () => h(NuxtLink, getNuxtLinkProps(), slots.default)
  },
})

// Typed as a generic constructor (mirroring `NuxtLink`) so the `custom` prop and slot props
// resolve correctly through the wrapper (#3883).
export default NuxtLinkLocaleImpl as unknown as new <CustomProp extends boolean = false>(
  props: NuxtLinkLocaleProps<CustomProp> &
    VNodeProps &
    AllowedComponentProps &
    Omit<AnchorHTMLAttributes, keyof NuxtLinkLocaleProps<CustomProp>>
) => InstanceType<
  DefineSetupFnComponent<
    NuxtLinkLocaleProps<CustomProp> &
      VNodeProps &
      AllowedComponentProps &
      Omit<AnchorHTMLAttributes, keyof NuxtLinkLocaleProps<CustomProp>>,
    [],
    SlotsType<NuxtLinkLocaleSlots<CustomProp>>
  >
>
