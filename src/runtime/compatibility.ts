/**
 * Utility functions to support both VueI18n and Composer instances
 */

import type { Composer, I18n, VueI18n } from 'vue-i18n'

export function getI18nTarget(i18n: I18n | VueI18n | Composer) {
  return i18n != null && 'global' in i18n && 'mode' in i18n ? i18n.global : i18n
}

export function getComposer(i18n: I18n | VueI18n | Composer): Composer {
  const target = getI18nTarget(i18n)
  return '__composer' in target ? target.__composer : target
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
