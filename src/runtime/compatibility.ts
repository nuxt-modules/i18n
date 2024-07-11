/**
 * Utility functions to support both VueI18n and Composer instances
 */

import { isRef, unref } from 'vue'

import type { NuxtApp } from '#app'
import type { LocaleObject } from '#build/i18n.options.mjs'
import type { Composer, I18n, Locale, VueI18n } from 'vue-i18n'
import type { UnwrapRef } from 'vue'

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

/**
 * Extract the value of a property on a VueI18n or Composer instance
 */
function extractI18nProperty<T extends ReturnType<typeof getI18nTarget>, K extends keyof T>(
  i18n: T,
  key: K
): UnwrapRef<T[K]> {
  return unref(i18n[key]) as UnwrapRef<T[K]>
}

/**
 * Typesafe access to property of a VueI18n or Composer instance
 */
export function getI18nProperty<K extends keyof ReturnType<typeof getI18nTarget>>(i18n: I18n, property: K) {
  return extractI18nProperty(getI18nTarget(i18n), property)
}

/**
 * Sets the value of the locale property on VueI18n or Composer instance
 *
 * This differs from the instance `setLocale` method in that it sets the
 * locale property directly without triggering other side effects
 */
export function setLocaleProperty(i18n: I18n, locale: Locale): void {
  const target = getI18nTarget(i18n)
  if (isRef(target.locale)) {
    target.locale.value = locale
  } else {
    target.locale = locale
  }
}

export function getLocale(i18n: I18n): Locale {
  return getI18nProperty(i18n, 'locale')
}

export function getLocales(i18n: I18n): string[] | LocaleObject[] {
  return getI18nProperty(i18n, 'locales')
}

export function getLocaleCodes(i18n: I18n): string[] {
  return getI18nProperty(i18n, 'localeCodes')
}

export function _setLocale(i18n: I18n, locale: Locale) {
  return getI18nTarget(i18n).setLocale(locale)
}

export function setLocaleCookie(i18n: I18n, locale: Locale) {
  return getI18nTarget(i18n).setLocaleCookie(locale)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeLocaleMessage(i18n: I18n, locale: Locale, messages: Record<string, any>) {
  return getI18nTarget(i18n).mergeLocaleMessage(locale, messages)
}

export async function onBeforeLanguageSwitch(
  i18n: I18n,
  oldLocale: string,
  newLocale: string,
  initial: boolean,
  context: NuxtApp
) {
  return getI18nTarget(i18n).onBeforeLanguageSwitch(oldLocale, newLocale, initial, context)
}

export function onLanguageSwitched(i18n: I18n, oldLocale: string, newLocale: string) {
  return getI18nTarget(i18n).onLanguageSwitched(oldLocale, newLocale)
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
