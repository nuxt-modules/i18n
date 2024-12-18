/**
 * Utility functions to support both VueI18n and Composer instances
 */

import { isRef } from 'vue'

import type { Composer, I18n, VueI18n } from 'vue-i18n'

function isI18nInstance(i18n: I18n | VueI18n | Composer): i18n is I18n {
  return i18n != null && 'global' in i18n && 'mode' in i18n
}

function isComposer(target: I18n | VueI18n | Composer): target is Composer {
  return target != null && !('__composer' in target) && 'locale' in target && isRef(target.locale)
}

export function isVueI18n(target: I18n | VueI18n | Composer): target is VueI18n {
  return target != null && '__composer' in target
}

export function getI18nTarget(i18n: I18n | VueI18n | Composer) {
  return isI18nInstance(i18n) ? i18n.global : i18n
}

export function getComposer(i18n: I18n | VueI18n | Composer): Composer {
  const target = getI18nTarget(i18n)

  if (isComposer(target)) return target
  if (isVueI18n(target)) return target.__composer

  return target
}

declare module 'vue-i18n' {
  interface VueI18n {
    /**
     * This is not exposed in VueI18n's types, but it's used internally
     * @internal
     */
    __composer: Composer
  }
}
