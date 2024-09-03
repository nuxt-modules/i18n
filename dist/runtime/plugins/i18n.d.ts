import type { getRouteBaseName, localePath, localeRoute, switchLocalePath, localeHead } from '../routing/compatibles.js';
import type { LocaleHeadFunction, LocalePathFunction, LocaleRouteFunction, RouteBaseNameFunction, SwitchLocalePathFunction } from '../composables.js';
declare const _default: any;
export default _default;
declare module '#app' {
    interface NuxtApp {
        /**
         * Returns base name of current (if argument not provided) or passed in route.
         *
         * @remarks
         * Base name is name of the route without locale suffix and other metadata added by nuxt i18n module
         *
         * @param givenRoute - A route.
         *
         * @returns The route base name. if cannot get, `undefined` is returned.
         */
        $getRouteBaseName: (...args: Parameters<RouteBaseNameFunction>) => ReturnType<typeof getRouteBaseName>;
        /**
         * Returns localized path for passed in route.
         *
         * @remarks
         * If locale is not specified, uses current locale.
         *
         * @param route - A route.
         * @param locale - A locale, optional.
         *
         * @returns A path of the current route.
         */
        $localePath: (...args: Parameters<LocalePathFunction>) => ReturnType<typeof localePath>;
        /**
         * Returns localized route for passed in `route` parameters.
         *
         * @remarks
         * If `locale` is not specified, uses current locale.
         *
         * @param route - A route.
         * @param locale - A {@link Locale | locale}, optional.
         *
         * @returns A route. if cannot resolve, `undefined` is returned.
         */
        $localeRoute: (...args: Parameters<LocaleRouteFunction>) => ReturnType<typeof localeRoute>;
        /**
         * Returns localized head properties for locale-related aspects.
         *
         * @param options - An options object, see `I18nHeadOptions`.
         *
         * @returns The localized head properties.
         */
        $localeHead: (...args: Parameters<LocaleHeadFunction>) => ReturnType<typeof localeHead>;
        /**
         * Returns path of the current route for specified locale
         *
         * @param locale - A {@link Locale}
         *
         * @returns A path of the current route
         */
        $switchLocalePath: (...args: Parameters<SwitchLocalePathFunction>) => ReturnType<typeof switchLocalePath>;
    }
}
