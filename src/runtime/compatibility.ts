/**
 * Utility functions to support both VueI18n and Composer instances
 */

import type { Composer, I18n, VueI18n } from 'vue-i18n'

export function getI18nTarget(i18n: I18n | VueI18n | Composer) {
  return 'global' in i18n ? i18n.global : i18n
}

export function getComposer(i18n: I18n | VueI18n | Composer): Composer {
  const target = getI18nTarget(i18n)
  return '__composer' in target ? target.__composer : target
}

declare module 'vue-i18n' {
  interface VueI18n {
    /* @internal not exposed by vue-i18n but used internally */
    __composer: Composer
  }
}
