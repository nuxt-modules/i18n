import { deepCopy, isFunction, isArray, isObject, isString } from "@intlify/shared";
import { createLogger } from "virtual:nuxt-i18n-logger";
const cacheMessages = /* @__PURE__ */ new Map();
export async function loadVueI18nOptions(vueI18nConfigs, nuxt) {
  const vueI18nOptions = { messages: {} };
  for (const configFile of vueI18nConfigs) {
    const { default: resolver } = await configFile();
    const resolved = isFunction(resolver) ? await nuxt.runWithContext(async () => await resolver()) : resolver;
    deepCopy(resolved, vueI18nOptions);
  }
  return vueI18nOptions;
}
export function makeFallbackLocaleCodes(fallback, locales) {
  let fallbackLocales = [];
  if (isArray(fallback)) {
    fallbackLocales = fallback;
  } else if (isObject(fallback)) {
    const targets = [...locales, "default"];
    for (const locale of targets) {
      if (fallback[locale]) {
        fallbackLocales = [...fallbackLocales, ...fallback[locale].filter(Boolean)];
      }
    }
  } else if (isString(fallback) && locales.every((locale) => locale !== fallback)) {
    fallbackLocales.push(fallback);
  }
  return fallbackLocales;
}
export async function loadInitialMessages(messages, localeLoaders, options) {
  const { defaultLocale, initialLocale, localeCodes, fallbackLocale, lazy } = options;
  if (lazy && fallbackLocale) {
    const fallbackLocales = makeFallbackLocaleCodes(fallbackLocale, [defaultLocale, initialLocale]);
    await Promise.all(fallbackLocales.map((locale) => loadAndSetLocaleMessages(locale, localeLoaders, messages)));
  }
  const locales = lazy ? [...(/* @__PURE__ */ new Set()).add(defaultLocale).add(initialLocale)] : localeCodes;
  await Promise.all(locales.map((locale) => loadAndSetLocaleMessages(locale, localeLoaders, messages)));
  return messages;
}
async function loadMessage(locale, { key, load }) {
  const logger = /* @__PURE__ */ createLogger("loadMessage");
  let message = null;
  try {
    __DEBUG__ && logger.log({ locale });
    const getter = await load().then((r) => "default" in r ? r.default : r);
    if (isFunction(getter)) {
      message = await getter(locale);
      __DEBUG__ && logger.log("dynamic load", logger.level >= 999 ? message : "");
    } else {
      message = getter;
      if (message != null && cacheMessages) {
        cacheMessages.set(key, message);
      }
      __DEBUG__ && logger.log("loaded", logger.level >= 999 ? message : "");
    }
  } catch (e) {
    console.error("Failed locale loading: " + e.message);
  }
  return message;
}
export async function loadLocale(locale, localeLoaders, setter) {
  const logger = /* @__PURE__ */ createLogger("loadLocale");
  const loaders = localeLoaders[locale];
  if (loaders == null) {
    console.warn("Could not find messages for locale code: " + locale);
    return;
  }
  const targetMessage = {};
  for (const loader of loaders) {
    let message = null;
    if (cacheMessages && cacheMessages.has(loader.key) && loader.cache) {
      __DEBUG__ && logger.log(loader.key + " is already loaded");
      message = cacheMessages.get(loader.key);
    } else {
      __DEBUG__ && !loader.cache && logger.log(loader.key + " bypassing cache!");
      __DEBUG__ && logger.log(loader.key + " is loading ...");
      message = await loadMessage(locale, loader);
    }
    if (message != null) {
      deepCopy(message, targetMessage);
    }
  }
  setter(locale, targetMessage);
}
export async function loadAndSetLocaleMessages(locale, localeLoaders, messages) {
  const setter = (locale2, message) => {
    const base = messages[locale2] || {};
    deepCopy(message, base);
    messages[locale2] = base;
  };
  await loadLocale(locale, localeLoaders, setter);
}
