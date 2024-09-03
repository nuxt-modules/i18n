import { useRequestHeaders, useCookie as useNuxtCookie } from "#imports";
import { ref, computed, watch, onUnmounted } from "vue";
import { parseAcceptLanguage, wrapComposable, runtimeDetectBrowserLanguage } from "../internal.js";
import { localeCodes, normalizedLocales } from "#build/i18n.options.mjs";
import { getActiveHead } from "unhead";
import { getNormalizedLocales, initCommonComposableOptions } from "../utils.js";
import {
  getAlternateOgLocales,
  getCanonicalLink,
  getCurrentOgLocale,
  getHreflangLinks,
  getOgUrl,
  getRouteBaseName,
  localeHead,
  localeLocation,
  localePath,
  localeRoute,
  switchLocalePath
} from "../routing/compatibles/index.js";
import { findBrowserLocale } from "../routing/utils.js";
import { getLocale, getLocales, getComposer } from "../compatibility.js";
export * from "vue-i18n";
export * from "./shared.js";
export function useSetI18nParams(seoAttributes) {
  const common = initCommonComposableOptions();
  const head = getActiveHead();
  const i18n = getComposer(common.i18n);
  const router = common.router;
  const locale = getLocale(common.i18n);
  const locales = getNormalizedLocales(getLocales(common.i18n));
  const _i18nParams = ref({});
  const experimentalSSR = common.runtimeConfig.public.i18n.experimental.switchLocalePathLinkSSR;
  const i18nParams = computed({
    get() {
      return experimentalSSR ? common.metaState.value : router.currentRoute.value.meta.nuxtI18n ?? {};
    },
    set(val) {
      common.metaState.value = val;
      _i18nParams.value = val;
      router.currentRoute.value.meta.nuxtI18n = val;
    }
  });
  const stop = watch(
    () => router.currentRoute.value.fullPath,
    () => {
      router.currentRoute.value.meta.nuxtI18n = experimentalSSR ? common.metaState.value : _i18nParams.value;
    }
  );
  onUnmounted(() => {
    stop();
  });
  const currentLocale = getNormalizedLocales(locales).find((l) => l.code === locale) || { code: locale };
  const currentLocaleLanguage = currentLocale.language;
  const setMeta = () => {
    const metaObject = {
      link: [],
      meta: []
    };
    if (locale && i18n.locales) {
      const idAttribute = "id";
      metaObject.link.push(
        ...getHreflangLinks(common, locales, idAttribute),
        ...getCanonicalLink(common, idAttribute, seoAttributes)
      );
      metaObject.meta.push(
        ...getOgUrl(common, idAttribute, seoAttributes),
        ...getCurrentOgLocale(currentLocale, currentLocaleLanguage, idAttribute),
        ...getAlternateOgLocales(locales, currentLocaleLanguage, idAttribute)
      );
    }
    head?.push(metaObject);
  };
  return function(params) {
    i18nParams.value = { ...params };
    setMeta();
  };
}
export function useLocaleHead({
  addDirAttribute = false,
  addSeoAttributes = false,
  identifierAttribute = "hid"
} = {}) {
  const common = initCommonComposableOptions();
  const metaObject = ref({
    htmlAttrs: {},
    link: [],
    meta: []
  });
  function cleanMeta() {
    metaObject.value = {
      htmlAttrs: {},
      link: [],
      meta: []
    };
  }
  function updateMeta() {
    metaObject.value = localeHead(common, {
      addDirAttribute,
      addSeoAttributes,
      identifierAttribute
    });
  }
  if (import.meta.client) {
    const i18n = getComposer(common.i18n);
    const stop = watch(
      [() => common.router.currentRoute.value, i18n.locale],
      () => {
        cleanMeta();
        updateMeta();
      },
      { immediate: true }
    );
    onUnmounted(() => stop());
  } else {
    updateMeta();
  }
  return metaObject;
}
export function useRouteBaseName() {
  return wrapComposable(getRouteBaseName);
}
export function useLocalePath() {
  return wrapComposable(localePath);
}
export function useLocaleRoute() {
  return wrapComposable(localeRoute);
}
export function useLocaleLocation() {
  return wrapComposable(localeLocation);
}
export function useSwitchLocalePath() {
  return wrapComposable(switchLocalePath);
}
export function useBrowserLocale() {
  const headers = useRequestHeaders(["accept-language"]);
  return findBrowserLocale(
    normalizedLocales,
    import.meta.client ? navigator.languages : parseAcceptLanguage(headers["accept-language"] || "")
  ) || null;
}
export function useCookieLocale() {
  const locale = ref("");
  const detect = runtimeDetectBrowserLanguage();
  if (detect && detect.useCookie) {
    const cookieKey = detect.cookieKey;
    let code = null;
    if (import.meta.client) {
      code = useNuxtCookie(cookieKey).value;
    } else if (import.meta.server) {
      const cookie = useRequestHeaders(["cookie"]);
      code = cookie[cookieKey];
    }
    if (code && localeCodes.includes(code)) {
      locale.value = code;
    }
  }
  return locale;
}
const warnRuntimeUsage = (method) => console.warn(
  method + "() is a compiler-hint helper that is only usable inside the script block of a single file component. Its arguments should be compiled away and passing it at runtime has no effect."
);
export function defineI18nRoute(route) {
  if (import.meta.dev) {
    warnRuntimeUsage("defineI18nRoute");
  }
}
