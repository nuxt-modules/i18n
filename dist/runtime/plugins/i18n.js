import { computed, ref, watch } from "vue";
import { createI18n } from "vue-i18n";
import {
  defineNuxtPlugin,
  useRoute,
  addRouteMiddleware,
  defineNuxtRouteMiddleware,
  useNuxtApp,
  useRouter
} from "#imports";
import {
  localeCodes,
  vueI18nConfigs,
  isSSG,
  localeLoaders,
  parallelPlugin,
  normalizedLocales
} from "#build/i18n.options.mjs";
import { loadVueI18nOptions, loadInitialMessages, loadLocale } from "../messages.js";
import { loadAndSetLocale, detectLocale, detectRedirect, navigate, injectNuxtHelpers, extendBaseUrl } from "../utils.js";
import {
  getBrowserLocale,
  getLocaleCookie,
  setLocaleCookie,
  detectBrowserLanguage,
  getI18nCookie,
  runtimeDetectBrowserLanguage,
  getHost
} from "../internal.js";
import { inBrowser, resolveBaseUrl } from "../routing/utils.js";
import { extendI18n, createLocaleFromRouteGetter } from "../routing/extends/index.js";
import { setLocale, getLocale, mergeLocaleMessage, setLocaleProperty } from "../compatibility.js";
import { createLogger } from "virtual:nuxt-i18n-logger";
export default defineNuxtPlugin({
  name: "i18n:plugin",
  parallel: parallelPlugin,
  async setup(nuxt) {
    const logger = /* @__PURE__ */ createLogger("plugin:i18n");
    const route = useRoute();
    const { vueApp: app } = nuxt;
    const nuxtContext = nuxt;
    const host = getHost();
    const { configLocales, defaultLocale, multiDomainLocales, strategy } = nuxtContext.$config.public.i18n;
    const hasDefaultForDomains = configLocales.some(
      (l) => typeof l !== "string" && Array.isArray(l.defaultForDomains)
    );
    let defaultLocaleDomain;
    if (defaultLocale) {
      defaultLocaleDomain = defaultLocale;
    } else if (hasDefaultForDomains) {
      const findDefaultLocale = configLocales.find(
        (l) => typeof l === "string" || !Array.isArray(l.defaultForDomains) ? false : l.defaultForDomains.includes(host ?? "")
      );
      defaultLocaleDomain = findDefaultLocale?.code ?? "";
    } else {
      defaultLocaleDomain = "";
    }
    if (multiDomainLocales && (strategy === "prefix_except_default" || strategy === "prefix_and_default")) {
      const router = useRouter();
      router.getRoutes().forEach((route2) => {
        if (route2.name?.toString().includes("___default")) {
          const routeNameLocale = route2.name.toString().split("___")[1];
          if (routeNameLocale !== defaultLocaleDomain) {
            router.removeRoute(route2.name);
          } else {
            const newRouteName = route2.name.toString().replace("___default", "");
            route2.name = newRouteName;
          }
        }
      });
    }
    const runtimeI18n = { ...nuxtContext.$config.public.i18n, defaultLocale: defaultLocaleDomain };
    runtimeI18n.baseUrl = extendBaseUrl();
    const _detectBrowserLanguage = runtimeDetectBrowserLanguage();
    __DEBUG__ && logger.log("isSSG", isSSG);
    __DEBUG__ && logger.log("useCookie on setup", _detectBrowserLanguage && _detectBrowserLanguage.useCookie);
    __DEBUG__ && logger.log("defaultLocale on setup", runtimeI18n.defaultLocale);
    const vueI18nOptions = await loadVueI18nOptions(vueI18nConfigs, useNuxtApp());
    vueI18nOptions.messages = vueI18nOptions.messages || {};
    vueI18nOptions.fallbackLocale = vueI18nOptions.fallbackLocale ?? false;
    const getLocaleFromRoute = createLocaleFromRouteGetter();
    const getDefaultLocale = (locale) => locale || vueI18nOptions.locale || "en-US";
    const localeCookie = getI18nCookie();
    let initialLocale = detectLocale(
      route,
      getLocaleFromRoute(route),
      getDefaultLocale(runtimeI18n.defaultLocale),
      {
        ssg: isSSG && runtimeI18n.strategy === "no_prefix" ? "ssg_ignore" : "normal",
        callType: "setup",
        firstAccess: true,
        localeCookie: getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
      },
      runtimeI18n
    );
    __DEBUG__ && logger.log("first detect initial locale", initialLocale);
    vueI18nOptions.messages = await loadInitialMessages(vueI18nOptions.messages, localeLoaders, {
      localeCodes,
      initialLocale,
      lazy: runtimeI18n.lazy,
      defaultLocale: runtimeI18n.defaultLocale,
      fallbackLocale: vueI18nOptions.fallbackLocale
    });
    initialLocale = getDefaultLocale(initialLocale);
    __DEBUG__ && logger.log("final initial locale:", initialLocale);
    const i18n = createI18n({ ...vueI18nOptions, locale: initialLocale });
    let notInitialSetup = true;
    const isInitialLocaleSetup = (locale) => initialLocale !== locale && notInitialSetup;
    let ssgModeInitialSetup = true;
    const isSSGModeInitialSetup = () => isSSG && ssgModeInitialSetup;
    if (isSSGModeInitialSetup() && runtimeI18n.strategy === "no_prefix" && import.meta.client) {
      nuxt.hook("app:mounted", async () => {
        __DEBUG__ && logger.log("hook app:mounted");
        const detected = detectBrowserLanguage(
          route,
          {
            ssg: "ssg_setup",
            callType: "setup",
            firstAccess: true,
            localeCookie: getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
          },
          initialLocale
        );
        __DEBUG__ && logger.log("app:mounted: detectBrowserLanguage (locale, reason, from) -", Object.values(detected));
        await setLocale(i18n, detected.locale);
        ssgModeInitialSetup = false;
      });
    }
    extendI18n(i18n, {
      extendComposer(composer) {
        const route2 = useRoute();
        const _locales = ref(runtimeI18n.configLocales);
        const _localeCodes = ref(localeCodes);
        const _baseUrl = ref("");
        composer.locales = computed(() => _locales.value);
        composer.localeCodes = computed(() => _localeCodes.value);
        composer.baseUrl = computed(() => _baseUrl.value);
        if (inBrowser) {
          watch(
            composer.locale,
            () => {
              _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl, nuxtContext);
            },
            { immediate: true }
          );
        } else {
          _baseUrl.value = resolveBaseUrl(runtimeI18n.baseUrl, nuxtContext);
        }
        composer.strategy = runtimeI18n.strategy;
        composer.localeProperties = computed(
          () => normalizedLocales.find((l) => l.code === composer.locale.value) || { code: composer.locale.value }
        );
        composer.setLocale = async (locale) => {
          const localeSetup = isInitialLocaleSetup(locale);
          const modified = await loadAndSetLocale(locale, i18n, runtimeI18n, localeSetup);
          if (modified && localeSetup) {
            notInitialSetup = false;
          }
          const redirectPath = await nuxtContext.runWithContext(
            () => detectRedirect({
              route: { to: route2 },
              locale,
              routeLocale: getLocaleFromRoute(route2),
              strategy: runtimeI18n.strategy
            })
          );
          __DEBUG__ && logger.log("redirectPath on setLocale", redirectPath);
          await nuxtContext.runWithContext(
            async () => await navigate(
              {
                nuxtApp: nuxtContext,
                i18n,
                redirectPath,
                locale,
                route: route2
              },
              { enableNavigate: true }
            )
          );
        };
        composer.loadLocaleMessages = async (locale) => {
          const setter = mergeLocaleMessage.bind(null, i18n);
          await loadLocale(locale, localeLoaders, setter);
        };
        composer.differentDomains = runtimeI18n.differentDomains;
        composer.defaultLocale = runtimeI18n.defaultLocale;
        composer.getBrowserLocale = () => getBrowserLocale();
        composer.getLocaleCookie = () => getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale);
        composer.setLocaleCookie = (locale) => setLocaleCookie(localeCookie, locale, _detectBrowserLanguage);
        composer.onBeforeLanguageSwitch = (oldLocale, newLocale, initialSetup, context) => nuxt.callHook("i18n:beforeLocaleSwitch", {
          oldLocale,
          newLocale,
          initialSetup,
          context
        });
        composer.onLanguageSwitched = (oldLocale, newLocale) => nuxt.callHook("i18n:localeSwitched", { oldLocale, newLocale });
        composer.finalizePendingLocaleChange = async () => {
          if (!i18n.__pendingLocale) {
            return;
          }
          setLocaleProperty(i18n, i18n.__pendingLocale);
          if (i18n.__resolvePendingLocalePromise) {
            await i18n.__resolvePendingLocalePromise();
          }
          i18n.__pendingLocale = void 0;
        };
        composer.waitForPendingLocaleChange = async () => {
          if (i18n.__pendingLocale && i18n.__pendingLocalePromise) {
            await i18n.__pendingLocalePromise;
          }
        };
      },
      extendComposerInstance(instance, c) {
        const properties = {
          locales: {
            get: () => c.locales.value
          },
          localeCodes: {
            get: () => c.localeCodes.value
          },
          baseUrl: {
            get: () => c.baseUrl.value
          },
          strategy: {
            get: () => c.strategy
          },
          localeProperties: {
            get: () => c.localeProperties.value
          },
          setLocale: {
            get: () => async (locale) => Reflect.apply(c.setLocale, c, [locale])
          },
          loadLocaleMessages: {
            get: () => async (locale) => Reflect.apply(c.loadLocaleMessages, c, [locale])
          },
          differentDomains: {
            get: () => c.differentDomains
          },
          defaultLocale: {
            get: () => c.defaultLocale
          },
          getBrowserLocale: {
            get: () => () => Reflect.apply(c.getBrowserLocale, c, [])
          },
          getLocaleCookie: {
            get: () => () => Reflect.apply(c.getLocaleCookie, c, [])
          },
          setLocaleCookie: {
            get: () => (locale) => Reflect.apply(c.setLocaleCookie, c, [locale])
          },
          onBeforeLanguageSwitch: {
            get: () => (oldLocale, newLocale, initialSetup, context) => Reflect.apply(c.onBeforeLanguageSwitch, c, [oldLocale, newLocale, initialSetup, context])
          },
          onLanguageSwitched: {
            get: () => (oldLocale, newLocale) => Reflect.apply(c.onLanguageSwitched, c, [oldLocale, newLocale])
          },
          finalizePendingLocaleChange: {
            get: () => () => Reflect.apply(c.finalizePendingLocaleChange, c, [])
          },
          waitForPendingLocaleChange: {
            get: () => () => Reflect.apply(c.waitForPendingLocaleChange, c, [])
          }
        };
        for (const [key, descriptor] of Object.entries(properties)) {
          Object.defineProperty(instance, key, descriptor);
        }
      }
    });
    app.use(i18n);
    injectNuxtHelpers(nuxtContext, i18n);
    let routeChangeCount = 0;
    addRouteMiddleware(
      "locale-changing",
      defineNuxtRouteMiddleware(async (to, from) => {
        __DEBUG__ && logger.log("locale-changing middleware", to, from);
        const routeLocale = getLocaleFromRoute(to);
        const locale = detectLocale(
          to,
          routeLocale,
          () => getLocale(i18n) || getDefaultLocale(runtimeI18n.defaultLocale),
          {
            ssg: isSSGModeInitialSetup() && runtimeI18n.strategy === "no_prefix" ? "ssg_ignore" : "normal",
            callType: "routing",
            firstAccess: routeChangeCount === 0,
            localeCookie: getLocaleCookie(localeCookie, _detectBrowserLanguage, runtimeI18n.defaultLocale)
          },
          runtimeI18n
        );
        __DEBUG__ && logger.log("detect locale", locale);
        const localeSetup = isInitialLocaleSetup(locale);
        __DEBUG__ && logger.log("localeSetup", localeSetup);
        const modified = await loadAndSetLocale(locale, i18n, runtimeI18n, localeSetup);
        if (modified && localeSetup) {
          notInitialSetup = false;
        }
        const redirectPath = await nuxtContext.runWithContext(
          () => detectRedirect({ route: { to, from }, locale, routeLocale, strategy: runtimeI18n.strategy }, true)
        );
        __DEBUG__ && logger.log("redirectPath on locale-changing middleware", redirectPath);
        routeChangeCount++;
        return await nuxtContext.runWithContext(
          async () => navigate({ nuxtApp: nuxtContext, i18n, redirectPath, locale, route: to })
        );
      }),
      { global: true }
    );
  }
});
