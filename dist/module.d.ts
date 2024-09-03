import * as _nuxt_schema from '@nuxt/schema';
import { NuxtPage, HookResult } from '@nuxt/schema';
import { Locale, I18nOptions } from 'vue-i18n';
import { ParsedPath } from 'path';
import { PluginOptions } from '@intlify/unplugin-vue-i18n';

declare const STRATEGIES: {
    readonly PREFIX: "prefix";
    readonly PREFIX_EXCEPT_DEFAULT: "prefix_except_default";
    readonly PREFIX_AND_DEFAULT: "prefix_and_default";
    readonly NO_PREFIX: "no_prefix";
};

type RedirectOnOptions = 'all' | 'root' | 'no prefix';
interface DetectBrowserLanguageOptions {
    alwaysRedirect?: boolean;
    cookieCrossOrigin?: boolean;
    cookieDomain?: string | null;
    cookieKey?: string;
    cookieSecure?: boolean;
    fallbackLocale?: Locale | null;
    redirectOn?: RedirectOnOptions;
    useCookie?: boolean;
}
type LocaleType = 'static' | 'dynamic' | 'unknown';
type LocaleFile = {
    path: string;
    cache?: boolean;
};
type LocaleInfo = {
    /**
     * NOTE:
     *  The following fields are for `file` in the nuxt i18n module `locales` option
     */
    path?: string;
    hash?: string;
    type?: LocaleType;
    /**
     * NOTE:
     *  The following fields are for `files` (excludes nuxt layers) in the nuxt i18n module `locales` option.
     */
    paths?: string[];
    hashes?: string[];
    types?: LocaleType[];
} & Omit<LocaleObject, 'file' | 'files'> & {
    code: Locale;
    files: LocaleFile[];
    meta?: (FileMeta & {
        file: LocaleFile;
    })[];
};
type FileMeta = {
    path: string;
    loadPath: string;
    hash: string;
    type: LocaleType;
    parsed: ParsedPath;
    key: string;
};
type VueI18nConfigPathInfo = {
    relative?: string;
    absolute?: string;
    hash?: string;
    type?: LocaleType;
    rootDir: string;
    relativeBase: string;
    meta: FileMeta;
};
interface RootRedirectOptions {
    path: string;
    statusCode: number;
}
type CustomRoutePages = {
    [key: string]: false | {
        [key: string]: false | string;
    };
};
interface ExperimentalFeatures {
    localeDetector?: string;
    switchLocalePathLinkSSR?: boolean;
    /**
     * Automatically imports/initializes `$t`, `$rt`, `$d`, `$n`, `$tm` and `$te` functions in `<script setup>` when used.
     *
     * @defaultValue `false`
     */
    autoImportTranslationFunctions?: boolean;
}
interface BundleOptions extends Pick<PluginOptions, 'compositionOnly' | 'runtimeOnly' | 'fullInstall' | 'dropMessageCompiler' | 'onlyLocales'> {
}
interface CustomBlocksOptions extends Pick<PluginOptions, 'defaultSFCLang' | 'globalSFCScope'> {
}
interface LocaleMessageCompilationOptions {
    strictMessage?: boolean;
    escapeHtml?: boolean;
}
type NuxtI18nOptions<Context = unknown, ConfiguredLocaleType extends string[] | LocaleObject[] = string[] | LocaleObject[]> = {
    /**
     * Path to a Vue I18n configuration file, the module will scan for a i18n.config{.js,.mjs,.ts} if left unset.
     *
     * @defaultValue `''` (empty string)
     */
    vueI18n?: string;
    experimental?: ExperimentalFeatures;
    /**
     * This can be set to a directory name to opt into the directory restructure for v9 which will have a default of 'i18n'.
     *
     * @defaultValue `undefined` (v8) or `'i18n'` (v9 release)
     */
    restructureDir?: string;
    bundle?: BundleOptions;
    compilation?: LocaleMessageCompilationOptions;
    customBlocks?: CustomBlocksOptions;
    /**
     * Enable when using different domains for each locale
     *
     * @remarks
     * If enabled, no prefix is added to routes
     * and `locales` must be configured as an array of `LocaleObject` objects with the `domain` property set.
     *
     * @defaultValue `false`
     */
    differentDomains?: boolean;
    /**
     * Enable when using different domains with different locales
     *
     * @remarks
     * If enabled, `locales` must be configured as an array of `LocaleObject` objects with the `domains` and `defaultForDomains` property set.
     *
     * @defaultValue `false`
     */
    multiDomainLocales?: boolean;
    detectBrowserLanguage?: DetectBrowserLanguageOptions | false;
    langDir?: string | null;
    lazy?: boolean;
    pages?: CustomRoutePages;
    customRoutes?: 'page' | 'config';
    /**
     * @internal
     * Do not use in projects - this is used internally for e2e tests to override default option merging.
     */
    overrides?: Omit<NuxtI18nOptions<Context>, 'overrides'>;
    /**
     * @internal
     * Do not use in projects
     */
    i18nModules?: {
        langDir?: string | null;
        locales?: NuxtI18nOptions<Context>['locales'];
    }[];
    rootRedirect?: string | RootRedirectOptions;
    skipSettingLocaleOnNavigate?: boolean;
    types?: 'composition' | 'legacy';
    debug?: boolean | 'verbose';
    dynamicRouteParams?: boolean;
    parallelPlugin?: boolean;
    /**
     * The app's default locale
     *
     * @remarks
     * When using `prefix_except_default` strategy, URLs for locale specified here won't have a prefix.
     *
     * It's recommended to set this to some locale regardless of chosen strategy, as it will be used as a fallback locale when navigating to a non-existent route
     *
     * @defaultValue '' (empty string)
     */
    defaultLocale?: Locale;
    /**
     * List of locales supported by your app
     *
     * @remarks
     * Can either be an array of string codes (e.g. `['en', 'fr']`) or an array of {@link LocaleObject} for more complex configurations
     *
     * @defaultValue []
     */
    locales?: ConfiguredLocaleType;
    /**
     * Routes strategy
     *
     * @remarks
     * Can be set to one of the following:
     *
     * - `no_prefix`: routes won't have a locale prefix
     * - `prefix_except_default`: locale prefix added for every locale except default
     * - `prefix`: locale prefix added for every locale
     * - `prefix_and_default`: locale prefix added for every locale and default
     *
     * @defaultValue 'prefix_except_default'
     */
    strategy?: Strategies;
    /**
     * Whether to use trailing slash
     *
     * @defaultValue false
     */
    trailingSlash?: boolean;
    /**
     * Internal separator used for generated route names for each locale. You shouldn't need to change this
     *
     * @defaultValue '___'
     */
    routesNameSeparator?: string;
    /**
     * Internal suffix added to generated route names for default locale
     *
     * @remarks
     * if strategy is prefix_and_default. You shouldn't need to change this.
     *
     * @defaultValue 'default'
     */
    defaultLocaleRouteNameSuffix?: string;
    /**
     * Default direction direction
     *
     * @defaultValue 'ltr'
     */
    defaultDirection?: Directions;
    /**
     * The fallback base URL to use as a prefix for alternate URLs in hreflang tags.
     *
     * @remarks
     * By default VueRouter's base URL will be used and only if that is not available, fallback URL will be used.
     *
     * Can also be a function (will be passed a Nuxt Context as a parameter) that returns a string.
     *
     * Useful to make base URL dynamic based on request headers.
     *
     * @defaultValue ''
     */
    baseUrl?: string | BaseUrlResolveHandler<Context>;
};
type VueI18nConfig = () => Promise<{
    default: I18nOptions | (() => I18nOptions | Promise<I18nOptions>);
}>;
/**
 * Routing strategy
 *
 * @public
 */
type Strategies = (typeof STRATEGIES)[keyof typeof STRATEGIES];
/**
 * Direction
 *
 * @public
 */
type Directions = 'ltr' | 'rtl' | 'auto';
/**
 * Locale object
 *
 * @public
 */
interface LocaleObject<T = Locale> extends Record<string, any> {
    code: T;
    name?: string;
    dir?: Directions;
    domain?: string;
    domains?: string[];
    defaultForDomains?: string[];
    file?: string | LocaleFile;
    files?: string[] | LocaleFile[];
    isCatchallLocale?: boolean;
    /**
     * @deprecated in v9, use `language` instead
     */
    iso?: string;
    language?: string;
}
/**
 * @public
 */
type BaseUrlResolveHandler<Context = any> = (context: Context) => string;
/**
 * Options to compute route localizing
 *
 * @remarks
 * The route options that is compute the route to be localized on {@link localizeRoutes}
 *
 * @public
 */
interface ComputedRouteOptions {
    locales: readonly Locale[];
    paths: Record<Locale, string>;
}
/**
 * Resolver for route localizing options
 *
 * @public
 */
type RouteOptionsResolver = (route: NuxtPage, localeCodes: Locale[]) => ComputedRouteOptions | undefined;
/**
 * Localize route path prefix judgment options used in {@link LocalizeRoutesPrefixable}
 *
 * @public
 */
interface PrefixLocalizedRouteOptions {
    /**
     * Current locale
     */
    locale: Locale;
    /**
     * Default locale
     */
    defaultLocale?: Locale | undefined;
    /**
     * The parent route of the route to be resolved
     */
    parent: NuxtPage | undefined;
    /**
     * The path of route
     */
    path: string;
}
/**
 * SEO Attribute options.
 *
 * @public
 */
interface SeoAttributesOptions {
    /**
     * An array of strings corresponding to query params you would like to include in your canonical URL.
     *
     * @defaultValue []
     */
    canonicalQueries?: string[];
}
/**
 * Options for {@link localeHead} function.
 *
 * @public
 */
interface I18nHeadOptions {
    /**
     * Adds a `dir` attribute to the HTML element.
     *
     * @defaultValue false
     */
    addDirAttribute?: boolean;
    /**
     * Adds various SEO attributes.
     *
     * @defaultValue false
     */
    addSeoAttributes?: boolean | SeoAttributesOptions;
    /**
     * Identifier attribute of `<meta>` tag
     *
     * @defaultValue 'hid'
     */
    identifierAttribute?: string;
}
/**
 * Meta attributes for head properties.
 *
 * @public
 */
type MetaAttrs = Record<string, any>;
/**
 * I18n header meta info.
 *
 * @public
 */
interface I18nHeadMetaInfo {
    htmlAttrs?: MetaAttrs;
    meta?: MetaAttrs[];
    link?: MetaAttrs[];
}
/**
 * Route path prefix judgment options used in {@link Prefixable}
 */
type PrefixableOptions = {
    /**
     * Current locale
     */
    currentLocale: Locale;
    /**
     * Default locale
     */
    defaultLocale: Locale;
    /**
     * Curernt strategy
     */
    strategy: Strategies;
};
/**
 * The intercept handler which is called in {@link switchLocalePath} function
 */
type SwitchLocalePathIntercepter = (path: string, locale: Locale) => string;

declare const _default: _nuxt_schema.NuxtModule<NuxtI18nOptions, NuxtI18nOptions, false>;

type UserNuxtI18nOptions = Omit<NuxtI18nOptions, 'locales'> & {
    locales?: string[] | LocaleObject<string>[];
};
interface ModuleOptions extends UserNuxtI18nOptions {
}
interface ModulePublicRuntimeConfig {
    i18n: {
        baseUrl: NuxtI18nOptions['baseUrl'];
        rootRedirect: NuxtI18nOptions['rootRedirect'];
        multiDomainLocales?: NuxtI18nOptions['multiDomainLocales'];
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        experimental: NonNullable<NuxtI18nOptions['experimental']>;
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        configLocales: NonNullable<Required<NuxtI18nOptions<unknown>>['locales']>;
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        differentDomains: Required<NuxtI18nOptions>['differentDomains'];
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        skipSettingLocaleOnNavigate: Required<NuxtI18nOptions>['skipSettingLocaleOnNavigate'];
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        defaultLocale: Required<NuxtI18nOptions>['defaultLocale'];
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        lazy: Required<NuxtI18nOptions>['lazy'];
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        defaultDirection: Required<NuxtI18nOptions>['defaultDirection'];
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        detectBrowserLanguage: Required<NuxtI18nOptions>['detectBrowserLanguage'];
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        strategy: Required<NuxtI18nOptions>['strategy'];
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        routesNameSeparator: Required<NuxtI18nOptions>['routesNameSeparator'];
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        defaultLocaleRouteNameSuffix: Required<NuxtI18nOptions>['defaultLocaleRouteNameSuffix'];
        /**
         * Overwritten at build time, used to pass generated options to runtime
         *
         * @internal
         */
        trailingSlash: Required<NuxtI18nOptions>['trailingSlash'];
    };
}
interface ModuleHooks {
    'i18n:registerModule': (registerModule: (config: Pick<NuxtI18nOptions<unknown>, 'langDir' | 'locales'>) => void) => HookResult;
}
interface ModuleRuntimeHooks {
    'i18n:beforeLocaleSwitch': <Context = unknown>(params: {
        oldLocale: Locale;
        newLocale: Locale;
        initialSetup: boolean;
        context: Context;
    }) => HookResult;
    'i18n:localeSwitched': (params: {
        oldLocale: Locale;
        newLocale: Locale;
    }) => HookResult;
}
declare module '#app' {
    interface RuntimeNuxtHooks extends ModuleRuntimeHooks {
    }
}
declare module '@nuxt/schema' {
    interface NuxtConfig {
        ['i18n']?: Partial<UserNuxtI18nOptions>;
    }
    interface NuxtOptions {
        ['i18n']?: UserNuxtI18nOptions;
    }
    interface NuxtHooks extends ModuleHooks {
    }
    interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {
    }
}

export { type BaseUrlResolveHandler, type BundleOptions, type ComputedRouteOptions, type CustomBlocksOptions, type CustomRoutePages, type DetectBrowserLanguageOptions, type Directions, type ExperimentalFeatures, type FileMeta, type I18nHeadMetaInfo, type I18nHeadOptions, type LocaleFile, type LocaleInfo, type LocaleMessageCompilationOptions, type LocaleObject, type LocaleType, type MetaAttrs, type ModuleHooks, type ModuleOptions, type ModulePublicRuntimeConfig, type ModuleRuntimeHooks, type NuxtI18nOptions, type PrefixLocalizedRouteOptions, type PrefixableOptions, type RedirectOnOptions, type RootRedirectOptions, type RouteOptionsResolver, type SeoAttributesOptions, type Strategies, type SwitchLocalePathIntercepter, type VueI18nConfig, type VueI18nConfigPathInfo, _default as default };
