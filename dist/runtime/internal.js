import { isArray, isString, isObject } from "@intlify/shared";
import { hasProtocol } from "ufo";
import isHTTPS from "is-https";
import { useRequestHeaders, useRequestEvent, useCookie as useNuxtCookie, useRuntimeConfig, useNuxtApp } from "#imports";
import { NUXT_I18N_MODULE_ID, DEFAULT_COOKIE_KEY, isSSG, localeCodes, normalizedLocales } from "#build/i18n.options.mjs";
import { findBrowserLocale, getLocalesRegex } from "./routing/utils.js";
import { initCommonComposableOptions } from "./utils.js";
import { createLogger } from "virtual:nuxt-i18n-logger";
export function formatMessage(message) {
  return NUXT_I18N_MODULE_ID + " " + message;
}
export function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
export function wrapComposable(fn, common = initCommonComposableOptions()) {
  return (...args) => fn(common, ...args);
}
export function parseAcceptLanguage(input) {
  return input.split(",").map((tag) => tag.split(";")[0]);
}
export function getBrowserLocale() {
  let ret;
  const logger = /* @__PURE__ */ createLogger("getBrowserLocale");
  if (import.meta.client) {
    if (navigator.languages) {
      ret = findBrowserLocale(normalizedLocales, navigator.languages);
      __DEBUG__ && logger.log("(navigator.languages, ret) -", navigator.languages, ret);
    }
  } else if (import.meta.server) {
    const header = useRequestHeaders(["accept-language"]);
    __DEBUG__ && logger.log("accept-language", header);
    const accept = header["accept-language"];
    if (accept) {
      ret = findBrowserLocale(normalizedLocales, parseAcceptLanguage(accept));
      __DEBUG__ && logger.log("ret", ret);
    }
  }
  return ret;
}
export function getI18nCookie() {
  const detect = runtimeDetectBrowserLanguage();
  const cookieKey = detect && detect.cookieKey || DEFAULT_COOKIE_KEY;
  const date = /* @__PURE__ */ new Date();
  const cookieOptions = {
    expires: new Date(date.setDate(date.getDate() + 365)),
    path: "/",
    sameSite: detect && detect.cookieCrossOrigin ? "none" : "lax",
    secure: detect && detect.cookieCrossOrigin || detect && detect.cookieSecure
  };
  if (detect && detect.cookieDomain) {
    cookieOptions.domain = detect.cookieDomain;
  }
  return useNuxtCookie(cookieKey, cookieOptions);
}
export function getLocaleCookie(cookieRef, detect, defaultLocale) {
  const env = import.meta.client ? "client" : "server";
  const logger = /* @__PURE__ */ createLogger(`getLocaleCookie:${env}`);
  __DEBUG__ && logger.log({
    useCookie: detect && detect.useCookie,
    cookieKey: detect && detect.cookieKey,
    localeCodes
  });
  if (detect === false || !detect.useCookie) {
    return;
  }
  const localeCode = cookieRef.value ?? void 0;
  if (localeCode == null) {
    __DEBUG__ && logger.log(`none`);
    return;
  }
  if (localeCodes.includes(localeCode)) {
    __DEBUG__ && logger.log(`locale from cookie: `, localeCode);
    return localeCode;
  }
  if (defaultLocale) {
    __DEBUG__ && logger.log(`unknown locale cookie (${localeCode}), setting to defaultLocale (${defaultLocale})`);
    cookieRef.value = defaultLocale;
    return defaultLocale;
  }
  __DEBUG__ && logger.log(`unknown locale cookie (${localeCode}), unsetting cookie`);
  cookieRef.value = void 0;
  return;
}
export function setLocaleCookie(cookieRef, locale, detect) {
  if (detect === false || !detect.useCookie) {
    return;
  }
  cookieRef.value = locale;
}
export var DetectFailure = /* @__PURE__ */ ((DetectFailure2) => {
  DetectFailure2["NOT_FOUND"] = "not_found_match";
  DetectFailure2["FIRST_ACCESS"] = "first_access_only";
  DetectFailure2["NO_REDIRECT_ROOT"] = "not_redirect_on_root";
  DetectFailure2["NO_REDIRECT_NO_PREFIX"] = "not_redirect_on_no_prefix";
  DetectFailure2["SSG_IGNORE"] = "detect_ignore_on_ssg";
  return DetectFailure2;
})(DetectFailure || {});
var DetectFrom = /* @__PURE__ */ ((DetectFrom2) => {
  DetectFrom2["COOKIE"] = "cookie";
  DetectFrom2["NAVIGATOR_HEADER"] = "navigator_or_header";
  DetectFrom2["FALLBACK"] = "fallback";
  return DetectFrom2;
})(DetectFrom || {});
export const DefaultDetectBrowserLanguageFromResult = { locale: "" };
export function detectBrowserLanguage(route, detectLocaleContext, locale = "") {
  const logger = /* @__PURE__ */ createLogger("detectBrowserLanguage");
  const _detect = runtimeDetectBrowserLanguage();
  if (!_detect) {
    return DefaultDetectBrowserLanguageFromResult;
  }
  const { strategy } = useRuntimeConfig().public.i18n;
  const { ssg, callType, firstAccess, localeCookie } = detectLocaleContext;
  __DEBUG__ && logger.log({ ssg, callType, firstAccess });
  if (isSSG && strategy === "no_prefix" && (import.meta.server || ssg === "ssg_ignore")) {
    return { locale: "", reason: "detect_ignore_on_ssg" /* SSG_IGNORE */ };
  }
  if (!firstAccess) {
    return { locale: strategy === "no_prefix" ? locale : "", reason: "first_access_only" /* FIRST_ACCESS */ };
  }
  const { redirectOn, alwaysRedirect, useCookie, fallbackLocale } = _detect;
  const path = isString(route) ? route : route.path;
  __DEBUG__ && logger.log({ locale, path, strategy, alwaysRedirect, redirectOn });
  if (strategy !== "no_prefix") {
    if (redirectOn === "root" && path !== "/") {
      __DEBUG__ && logger.log("not root", { path });
      return { locale: "", reason: "not_redirect_on_root" /* NO_REDIRECT_ROOT */ };
    }
    __DEBUG__ && redirectOn === "no prefix" && logger.log("no prefix -", { path });
    if (redirectOn === "no prefix" && !alwaysRedirect && path.match(getLocalesRegex(localeCodes))) {
      return { locale: "", reason: "not_redirect_on_no_prefix" /* NO_REDIRECT_NO_PREFIX */ };
    }
  }
  let from;
  const cookieMatch = useCookie && localeCookie || void 0;
  if (useCookie) {
    from = "cookie" /* COOKIE */;
  }
  const browserMatch = getBrowserLocale();
  if (!cookieMatch) {
    from = "navigator_or_header" /* NAVIGATOR_HEADER */;
  }
  const matchedLocale = cookieMatch || browserMatch;
  const resolved = matchedLocale || fallbackLocale || "";
  if (!matchedLocale && fallbackLocale) {
    from = "fallback" /* FALLBACK */;
  }
  __DEBUG__ && logger.log({ locale: resolved, cookieMatch, browserMatch, from });
  return { locale: resolved, from };
}
export function getHost() {
  let host;
  if (import.meta.client) {
    host = window.location.host;
  } else if (import.meta.server) {
    const header = useRequestHeaders(["x-forwarded-host", "host"]);
    let detectedHost;
    if ("x-forwarded-host" in header) {
      detectedHost = header["x-forwarded-host"];
    } else if ("host" in header) {
      detectedHost = header["host"];
    }
    host = isArray(detectedHost) ? detectedHost[0] : detectedHost;
  }
  return host;
}
export function getLocaleDomain(locales, strategy, route) {
  const logger = /* @__PURE__ */ createLogger(`getLocaleDomain`);
  let host = getHost() || "";
  const routePath = isObject(route) ? route.path : isString(route) ? route : "";
  if (host) {
    __DEBUG__ && logger.log(`locating domain for host`, { host, strategy, path: routePath });
    let matchingLocale;
    const matchingLocales = locales.filter((locale) => {
      if (locale && locale.domain) {
        let domain = locale.domain;
        if (hasProtocol(locale.domain)) {
          domain = locale.domain.replace(/(http|https):\/\//, "");
        }
        return domain === host;
      } else if (Array.isArray(locale?.domains)) {
        return locale.domains.includes(host);
      }
      return false;
    });
    if (matchingLocales.length === 1) {
      matchingLocale = matchingLocales[0];
      __DEBUG__ && logger.log(`found one matching domain`, { host, matchedLocale: matchingLocales[0].code });
    } else if (matchingLocales.length > 1) {
      if (strategy === "no_prefix") {
        console.warn(
          formatMessage(
            "Multiple matching domains found! This is not supported for no_prefix strategy in combination with differentDomains!"
          )
        );
        matchingLocale = matchingLocales[0];
      } else {
        if (route) {
          __DEBUG__ && logger.log(`check matched domain for locale match`, { path: routePath, host });
          if (routePath && routePath !== "") {
            const matches = routePath.match(getLocalesRegex(matchingLocales.map((l) => l.code)));
            if (matches && matches.length > 1) {
              matchingLocale = matchingLocales.find((l) => l.code === matches[1]);
              __DEBUG__ && logger.log(`matched locale from path`, { matchedLocale: matchingLocale?.code });
            }
          }
        }
        if (!matchingLocale) {
          matchingLocale = matchingLocales.find(
            (l) => Array.isArray(l.defaultForDomains) ? l.defaultForDomains.includes(host) : l.domainDefault
          );
          __DEBUG__ && logger.log(`no locale matched - using default for this domain`, { matchedLocale: matchingLocale?.code });
        }
      }
    }
    if (matchingLocale) {
      return matchingLocale.code;
    } else {
      host = "";
    }
  }
  return host;
}
export function getDomainFromLocale(localeCode) {
  const runtimeConfig = useRuntimeConfig();
  const nuxtApp = useNuxtApp();
  const host = getHost();
  const config = runtimeConfig.public.i18n;
  const lang = normalizedLocales.find((locale) => locale.code === localeCode);
  const domain = config?.locales?.[localeCode]?.domain || lang?.domain || config?.locales?.[localeCode]?.domains?.find((v) => v === host) || lang?.domains?.find((v) => v === host);
  if (domain) {
    if (hasProtocol(domain, { strict: true })) {
      return domain;
    }
    let protocol;
    if (import.meta.server) {
      const {
        node: { req }
      } = useRequestEvent(nuxtApp);
      protocol = req && isHTTPS(req) ? "https:" : "http:";
    } else {
      protocol = new URL(window.location.origin).protocol;
    }
    return protocol + "//" + domain;
  }
  console.warn(formatMessage("Could not find domain name for locale " + localeCode));
}
export const runtimeDetectBrowserLanguage = (opts = useRuntimeConfig().public.i18n) => {
  if (opts?.detectBrowserLanguage === false) return false;
  return opts?.detectBrowserLanguage;
};
