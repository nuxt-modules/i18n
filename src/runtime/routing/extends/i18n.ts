import { isObject, isFunction, assign } from '@intlify/shared'
import { computed, effectScope, ref, watch } from '#imports'
import { resolveBaseUrl, isVueI18n, getComposer, inBrowser } from '../utils'
import {
  getRouteBaseName,
  localeHead,
  localeLocation,
  localePath,
  localeRoute,
  resolveRoute,
  switchLocalePath
} from '../compatibles'
import { wrapComposable } from '../../internal'
import { initCommonComposableOptions } from '../../utils'

import type { NuxtApp } from 'nuxt/app'
import type {
  Composer,
  ComposerExtender,
  Disposer,
  ExportedGlobalComposer,
  I18n,
  VueI18n,
  VueI18nExtender
} from 'vue-i18n'
import type { LocaleObject, NuxtI18nOptions } from '#build/i18n.options.mjs'

/**
 * An options of Vue I18n Routing Plugin
 */
export interface VueI18nRoutingPluginOptions {
  /**
   * Whether to inject some option APIs style methods into Vue instance
   *
   * @defaultValue `true`
   */
  inject?: boolean
  /**
   * @internal
   */
  __composerExtend?: ComposerExtender
  /**
   * @internal
   */
  __vueI18nExtend?: VueI18nExtender
}

export interface ExtendPropertyDescriptors {
  [key: string]: Pick<PropertyDescriptor, 'get'>
}
export type ExtendComposerHook = (compser: Composer) => void
export type ExtendVueI18nHook = (composer: Composer) => ExtendPropertyDescriptors
export type ExtendExportedGlobalHook = (global: Composer) => ExtendPropertyDescriptors

export interface ExtendHooks {
  onExtendComposer?: ExtendComposerHook
  onExtendExportedGlobal?: ExtendExportedGlobalHook
  onExtendVueI18n?: ExtendVueI18nHook
}

export type VueI18nExtendOptions<Context = unknown> = Pick<NuxtI18nOptions<Context>, 'baseUrl'> & {
  locales?: string[] | LocaleObject[]
  localeCodes?: string[]
  context?: Context
  hooks?: ExtendHooks
}

export function extendI18n<Context = unknown, TI18n extends I18n = I18n>(
  i18n: TI18n,
  {
    locales = [],
    localeCodes = [],
    baseUrl = '',
    hooks = {},
    context = {} as Context
  }: VueI18nExtendOptions<Context> = {}
) {
  const scope = effectScope()

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const orgInstall = i18n.install
  // @ts-ignore
  i18n.install = (vue: NuxtApp['vueApp'], ...options: unknown[]) => {
    const pluginOptions = isPluginOptions(options[0]) ? assign({}, options[0]) : { inject: true }
    if (pluginOptions.inject == null) {
      pluginOptions.inject = true
    }
    const orgComposerExtend = pluginOptions.__composerExtend
    pluginOptions.__composerExtend = (localComposer: Composer) => {
      const globalComposer = getComposer(i18n)

      localComposer.locales = computed(() => globalComposer.locales.value)
      localComposer.localeCodes = computed(() => globalComposer.localeCodes.value)
      localComposer.baseUrl = computed(() => globalComposer.baseUrl.value)

      let orgComposerDispose: Disposer | undefined
      if (isFunction(orgComposerExtend)) {
        orgComposerDispose = Reflect.apply(orgComposerExtend, pluginOptions, [localComposer])
      }
      return () => {
        orgComposerDispose && orgComposerDispose()
      }
    }
    if (i18n.mode === 'legacy') {
      const orgVueI18nExtend = pluginOptions.__vueI18nExtend
      pluginOptions.__vueI18nExtend = (vueI18n: VueI18n) => {
        extendVueI18n(vueI18n, hooks.onExtendVueI18n)
        let orgVueI18nDispose: Disposer | undefined
        if (isFunction(orgVueI18nExtend)) {
          orgVueI18nDispose = Reflect.apply(orgVueI18nExtend, pluginOptions, [vueI18n])
        }
        return () => {
          orgVueI18nDispose && orgVueI18nDispose()
        }
      }
    }

    options[0] = pluginOptions
    Reflect.apply(orgInstall, i18n, [vue, ...options])

    const globalComposer = getComposer(i18n)

    // extend global
    scope.run(() => {
      extendComposer(globalComposer, { locales, localeCodes, baseUrl, hooks, context })
      if (i18n.mode === 'legacy' && isVueI18n(i18n.global)) {
        extendVueI18n(i18n.global, hooks.onExtendVueI18n)
      }
    })

    // extend vue component instance for Vue 3
    const app = vue

    // prettier-ignore
    const exported = i18n.mode === 'composition'
      ? app.config.globalProperties.$i18n as ExportedGlobalComposer
      // for legacy mode
      : null
    if (exported) {
      extendExportedGlobal(exported, globalComposer, hooks.onExtendExportedGlobal)
    }

    if (pluginOptions.inject) {
      const common = initCommonComposableOptions(i18n)
      // extend vue component instance
      vue.mixin({
        methods: {
          getRouteBaseName: wrapComposable(getRouteBaseName, common),
          resolveRoute: wrapComposable(resolveRoute, common),
          localePath: wrapComposable(localePath, common),
          localeRoute: wrapComposable(localeRoute, common),
          localeLocation: wrapComposable(localeLocation, common),
          switchLocalePath: wrapComposable(switchLocalePath, common),
          localeHead: wrapComposable(localeHead, common)
        }
      })
    }

    // dispose when app will be unmounting
    if (app.unmount) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const unmountApp = app.unmount
      app.unmount = () => {
        scope.stop()
        unmountApp()
      }
    }
  }

  return scope
}

function extendComposer<Context = unknown>(composer: Composer, options: VueI18nExtendOptions<Context>) {
  const { locales, localeCodes, baseUrl, context } = options

  const _locales = ref<string[] | LocaleObject[]>(locales!)
  const _localeCodes = ref<string[]>(localeCodes!)
  const _baseUrl = ref<string>('')

  // @ts-ignore
  composer.locales = computed(() => _locales.value)
  composer.localeCodes = computed(() => _localeCodes.value)
  composer.baseUrl = computed(() => _baseUrl.value)

  if (inBrowser) {
    watch(
      composer.locale,
      () => {
        _baseUrl.value = resolveBaseUrl(baseUrl!, context!)
      },
      { immediate: true }
    )
  } else {
    _baseUrl.value = resolveBaseUrl(baseUrl!, context!)
  }

  if (options.hooks && options.hooks.onExtendComposer) {
    options.hooks.onExtendComposer(composer)
  }
}

function extendPropertyDescriptors(
  composer: Composer,
  exported: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  hook?: ExtendVueI18nHook | ExtendExportedGlobalHook
): void {
  const properties: ExtendPropertyDescriptors[] = [
    {
      locales: {
        get() {
          return composer.locales.value
        }
      },
      localeCodes: {
        get() {
          return composer.localeCodes.value
        }
      },
      baseUrl: {
        get() {
          return composer.baseUrl.value
        }
      }
    }
  ]
  hook && properties.push(hook(composer))
  for (const property of properties) {
    for (const [key, descriptor] of Object.entries(property)) {
      Object.defineProperty(exported, key, descriptor)
    }
  }
}

function extendExportedGlobal(exported: ExportedGlobalComposer, g: Composer, hook?: ExtendExportedGlobalHook) {
  extendPropertyDescriptors(g, exported, hook)
}

function extendVueI18n(vueI18n: VueI18n, hook?: ExtendVueI18nHook): void {
  const c = getComposer(vueI18n)
  extendPropertyDescriptors(c, vueI18n, hook)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPluginOptions(options: any): options is VueI18nRoutingPluginOptions {
  return isObject(options) && ('inject' in options || '__composerExtend' in options || '__vueI18nExtend' in options)
}
