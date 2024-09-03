import { isRef, unref } from "vue";
function isI18nInstance(i18n) {
  return i18n != null && "global" in i18n && "mode" in i18n;
}
function isComposer(target) {
  return target != null && !("__composer" in target) && "locale" in target && isRef(target.locale);
}
export function isVueI18n(target) {
  return target != null && "__composer" in target;
}
export function getI18nTarget(i18n) {
  return isI18nInstance(i18n) ? i18n.global : i18n;
}
export function getComposer(i18n) {
  const target = getI18nTarget(i18n);
  if (isComposer(target)) return target;
  if (isVueI18n(target)) return target.__composer;
  return target;
}
function extractI18nProperty(i18n, key) {
  return unref(i18n[key]);
}
export function getI18nProperty(i18n, property) {
  return extractI18nProperty(getI18nTarget(i18n), property);
}
export function setLocaleProperty(i18n, locale) {
  const target = getI18nTarget(i18n);
  if (isRef(target.locale)) {
    target.locale.value = locale;
  } else {
    target.locale = locale;
  }
}
export function getLocale(i18n) {
  return getI18nProperty(i18n, "locale");
}
export function getLocales(i18n) {
  return getI18nProperty(i18n, "locales");
}
export function getLocaleCodes(i18n) {
  return getI18nProperty(i18n, "localeCodes");
}
export function setLocale(i18n, locale) {
  return getI18nTarget(i18n).setLocale(locale);
}
export function setLocaleCookie(i18n, locale) {
  return getI18nTarget(i18n).setLocaleCookie(locale);
}
export function mergeLocaleMessage(i18n, locale, messages) {
  return getI18nTarget(i18n).mergeLocaleMessage(locale, messages);
}
export async function onBeforeLanguageSwitch(i18n, oldLocale, newLocale, initial, context) {
  return getI18nTarget(i18n).onBeforeLanguageSwitch(oldLocale, newLocale, initial, context);
}
export function onLanguageSwitched(i18n, oldLocale, newLocale) {
  return getI18nTarget(i18n).onLanguageSwitched(oldLocale, newLocale);
}
