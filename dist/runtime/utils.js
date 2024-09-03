import { joinURL, isEqual } from "ufo";
import { isString, isFunction, isObject } from "@intlify/shared";
import { navigateTo, useNuxtApp, useRouter, useRuntimeConfig, useState } from "#imports";
import { NUXT_I18N_MODULE_ID, isSSG, localeLoaders, normalizedLocales } from "#build/i18n.options.mjs";
import {
  wrapComposable,
  detectBrowserLanguage,
  defineGetter,
  getLocaleDomain,
  getDomainFromLocale,
  runtimeDetectBrowserLanguage,
  getHost,
  DetectFailure
} from "./internal.js";
import { loadLocale, makeFallbackLocaleCodes } from "./messages.js";
import {
  localeHead,
  localePath,
  localeRoute,
  getRouteBaseName,
  switchLocalePath,
  DefaultPrefixable,
  DefaultSwitchLocalePathIntercepter
} from "./routing/compatibles/index.js";
import {
  getI18nProperty,
  getI18nTarget,
  getLocale,
  getLocaleCodes,
  mergeLocaleMessage,
  onBeforeLanguageSwitch,
  onLanguageSwitched,
  setLocaleProperty,
  setLocaleCookie
} from "./compatibility.js";
import { createLogger } from "virtual:nuxt-i18n-logger";
import { createLocaleFromRouteGetter } from "./routing/extends/router.js";
export function initCommonComposableOptions(i18n) {
  return {
    i18n: i18n ?? useNuxtApp().$i18n,
    router: useRouter(),
    runtimeConfig: useRuntimeConfig(),
    metaState: useState("nuxt-i18n-meta", () => ({}))
  };
}
export async function loadAndSetLocale(newLocale, i18n, runtimeI18n, initial = false) {
  const logger = /* @__PURE__ */ createLogger("loadAndSetLocale");
  const { differentDomains, skipSettingLocaleOnNavigate, lazy } = runtimeI18n;
  const opts = runtimeDetectBrowserLanguage(runtimeI18n);
  const nuxtApp = useNuxtApp();
  const oldLocale = getLocale(i18n);
  const localeCodes = getLocaleCodes(i18n);
  function syncCookie(locale = oldLocale) {
    if (opts === false || !opts.useCookie) return;
    if (skipSettingLocaleOnNavigate) return;
    setLocaleCookie(i18n, locale);
  }
  __DEBUG__ && logger.log({ newLocale, oldLocale, initial });
  if (!newLocale) {
    syncCookie();
    return false;
  }
  if (!initial && differentDomains) {
    syncCookie();
    return false;
  }
  if (oldLocale === newLocale) {
    syncCookie();
    return false;
  }
  const localeOverride = await onBeforeLanguageSwitch(i18n, oldLocale, newLocale, initial, nuxtApp);
  if (localeOverride && localeCodes.includes(localeOverride)) {
    if (oldLocale === localeOverride) {
      syncCookie();
      return false;
    }
    newLocale = localeOverride;
  }
  if (lazy) {
    const i18nFallbackLocales = getI18nProperty(i18n, "fallbackLocale");
    const setter = mergeLocaleMessage.bind(null, i18n);
    if (i18nFallbackLocales) {
      const fallbackLocales = makeFallbackLocaleCodes(i18nFallbackLocales, [newLocale]);
      await Promise.all(fallbackLocales.map((locale) => loadLocale(locale, localeLoaders, setter)));
    }
    await loadLocale(newLocale, localeLoaders, setter);
  }
  if (skipSettingLocaleOnNavigate) {
    return false;
  }
  syncCookie(newLocale);
  setLocaleProperty(i18n, newLocale);
  await onLanguageSwitched(i18n, oldLocale, newLocale);
  return true;
}
export function detectLocale(route, routeLocale, initialLocaleLoader, detectLocaleContext, runtimeI18n) {
  const { strategy, defaultLocale, differentDomains, multiDomainLocales } = runtimeI18n;
  const { localeCookie } = detectLocaleContext;
  const _detectBrowserLanguage = runtimeDetectBrowserLanguage(runtimeI18n);
  const logger = /* @__PURE__ */ createLogger("detectLocale");
  const initialLocale = isFunction(initialLocaleLoader) ? initialLocaleLoader() : initialLocaleLoader;
  __DEBUG__ && logger.log({ initialLocale });
  const detectedBrowser = detectBrowserLanguage(route, detectLocaleContext, initialLocale);
  __DEBUG__ && logger.log({ detectBrowserLanguage: detectedBrowser });
  if (detectedBrowser.reason === DetectFailure.SSG_IGNORE) {
    return initialLocale;
  }
  if (detectedBrowser.locale && detectedBrowser.from != null) {
    return detectedBrowser.locale;
  }
  let detected = "";
  __DEBUG__ && logger.log("1/3", { detected, strategy });
  if (differentDomains || multiDomainLocales) {
    detected ||= getLocaleDomain(normalizedLocales, strategy, route);
  } else if (strategy !== "no_prefix") {
    detected ||= routeLocale;
  }
  __DEBUG__ && logger.log("2/3", { detected, detectBrowserLanguage: _detectBrowserLanguage });
  const cookieLocale = _detectBrowserLanguage && _detectBrowserLanguage.useCookie && localeCookie;
  detected ||= cookieLocale || initialLocale || defaultLocale || "";
  __DEBUG__ && logger.log("3/3", { detected, cookieLocale, initialLocale, defaultLocale });
  return detected;
}
export function detectRedirect({ route, locale, routeLocale, strategy }, inMiddleware = false) {
  if (routeLocale === locale || strategy === "no_prefix") {
    return "";
  }
  const common = initCommonComposableOptions();
  const logger = /* @__PURE__ */ createLogger("detectRedirect");
  __DEBUG__ && logger.log({ route });
  __DEBUG__ && logger.log({ locale, routeLocale, inMiddleware });
  let redirectPath = switchLocalePath(common, locale, route.to);
  if (inMiddleware && !redirectPath) {
    redirectPath = localePath(common, route.to.fullPath, locale);
  }
  if (isEqual(redirectPath, route.to.fullPath) || route.from && isEqual(redirectPath, route.from.fullPath)) {
    return "";
  }
  return redirectPath;
}
function isRootRedirectOptions(rootRedirect) {
  return isObject(rootRedirect) && "path" in rootRedirect && "statusCode" in rootRedirect;
}
const useRedirectState = () => useState(NUXT_I18N_MODULE_ID + ":redirect", () => "");
function _navigate(redirectPath, status) {
  return navigateTo(redirectPath, { redirectCode: status });
}
export async function navigate(args, { status = 302, enableNavigate = false } = {}) {
  const { nuxtApp, i18n, locale, route } = args;
  const { rootRedirect, differentDomains, multiDomainLocales, skipSettingLocaleOnNavigate, configLocales, strategy } = nuxtApp.$config.public.i18n;
  const logger = /* @__PURE__ */ createLogger("navigate");
  let { redirectPath } = args;
  __DEBUG__ && logger.log("options", {
    status,
    rootRedirect,
    differentDomains,
    skipSettingLocaleOnNavigate,
    enableNavigate,
    isSSG
  });
  if (route.path === "/" && rootRedirect) {
    if (isString(rootRedirect)) {
      redirectPath = "/" + rootRedirect;
    } else if (isRootRedirectOptions(rootRedirect)) {
      redirectPath = "/" + rootRedirect.path;
      status = rootRedirect.statusCode;
    }
    redirectPath = nuxtApp.$localePath(redirectPath, locale);
    __DEBUG__ && logger.log("rootRedirect mode", { redirectPath, status });
    return _navigate(redirectPath, status);
  }
  if (import.meta.client && skipSettingLocaleOnNavigate) {
    i18n.__pendingLocale = locale;
    i18n.__pendingLocalePromise = new Promise((resolve) => {
      i18n.__resolvePendingLocalePromise = resolve;
    });
    if (!enableNavigate) {
      return;
    }
  }
  if (multiDomainLocales && strategy === "prefix_except_default") {
    const host = getHost();
    const currentDomain = configLocales.find((locale2) => {
      if (typeof locale2 !== "string") {
        return locale2.defaultForDomains?.find((domain) => domain === host);
      }
      return false;
    });
    const defaultLocaleForDomain = typeof currentDomain !== "string" ? currentDomain?.code : void 0;
    if (route.path.startsWith(`/${defaultLocaleForDomain}`)) {
      return _navigate(route.path.replace(`/${defaultLocaleForDomain}`, ""), status);
    } else if (!route.path.startsWith(`/${locale}`) && locale !== defaultLocaleForDomain) {
      const getLocaleFromRoute = createLocaleFromRouteGetter();
      const oldLocale = getLocaleFromRoute(route.path);
      if (oldLocale !== "") {
        return _navigate(`/${locale + route.path.replace(`/${oldLocale}`, "")}`, status);
      } else {
        return _navigate(`/${locale + (route.path === "/" ? "" : route.path)}`, status);
      }
    } else if (redirectPath && route.path !== redirectPath) {
      return _navigate(redirectPath, status);
    }
    return;
  }
  if (!differentDomains) {
    if (redirectPath) {
      return _navigate(redirectPath, status);
    }
  } else {
    const state = useRedirectState();
    __DEBUG__ && logger.log("redirect", { state: state.value, redirectPath });
    if (state.value && state.value !== redirectPath) {
      if (import.meta.client) {
        state.value = "";
        window.location.assign(redirectPath);
      } else if (import.meta.server) {
        __DEBUG__ && logger.log("differentDomains servermode", { redirectPath });
        state.value = redirectPath;
      }
    }
  }
}
export function injectNuxtHelpers(nuxt, i18n) {
  defineGetter(nuxt, "$i18n", getI18nTarget(i18n));
  defineGetter(nuxt, "$getRouteBaseName", wrapComposable(getRouteBaseName));
  defineGetter(nuxt, "$localePath", wrapComposable(localePath));
  defineGetter(nuxt, "$localeRoute", wrapComposable(localeRoute));
  defineGetter(nuxt, "$switchLocalePath", wrapComposable(switchLocalePath));
  defineGetter(nuxt, "$localeHead", wrapComposable(localeHead));
}
export function extendPrefixable(runtimeConfig = useRuntimeConfig()) {
  const logger = /* @__PURE__ */ createLogger("extendPrefixable");
  return (opts) => {
    __DEBUG__ && logger.log(DefaultPrefixable(opts));
    return DefaultPrefixable(opts) && !runtimeConfig.public.i18n.differentDomains;
  };
}
export function extendSwitchLocalePathIntercepter(runtimeConfig = useRuntimeConfig()) {
  const logger = /* @__PURE__ */ createLogger("extendSwitchLocalePathIntercepter");
  return (path, locale) => {
    if (runtimeConfig.public.i18n.differentDomains) {
      const domain = getDomainFromLocale(locale);
      __DEBUG__ && logger.log({ domain, path });
      if (domain) {
        return joinURL(domain, path);
      } else {
        return path;
      }
    } else {
      return DefaultSwitchLocalePathIntercepter(path, locale);
    }
  };
}
export function extendBaseUrl() {
  const logger = /* @__PURE__ */ createLogger("extendBaseUrl");
  return () => {
    const ctx = useNuxtApp();
    const { baseUrl, defaultLocale, differentDomains } = ctx.$config.public.i18n;
    if (isFunction(baseUrl)) {
      const baseUrlResult = baseUrl(ctx);
      __DEBUG__ && logger.log("using localeLoader function -", { baseUrlResult });
      return baseUrlResult;
    }
    const localeCode = isFunction(defaultLocale) ? defaultLocale() : defaultLocale;
    if (differentDomains && localeCode) {
      const domain = getDomainFromLocale(localeCode);
      if (domain) {
        __DEBUG__ && logger.log("using differentDomains -", { domain });
        return domain;
      }
    }
    if (baseUrl) {
      __DEBUG__ && logger.log("using runtimeConfig -", { baseUrl });
      return baseUrl;
    }
    return baseUrl;
  };
}
export function getNormalizedLocales(locales) {
  const normalized = [];
  for (const locale of locales) {
    if (isString(locale)) {
      normalized.push({ code: locale });
      continue;
    }
    normalized.push(locale);
  }
  return normalized;
}
