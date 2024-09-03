import type { Locale } from 'vue-i18n';
import type { RouteLocationNormalizedLoaded, RouteLocationPathRaw } from 'vue-router';
import type { Strategies } from '#build/i18n.options.mjs';
import type { CommonComposableOptions } from '../../utils.js';
/**
 * NOTE:
 * Nuxt route uses a proxy with getters for performance reasons (https://github.com/nuxt/nuxt/pull/21957).
 * Spreading will result in an empty object, so we make a copy of the route by accessing each getter property by name.
 */
export declare function routeToObject(route: RouteLocationNormalizedLoaded): {
    fullPath: string;
    params: import("vue-router").RouteParamsGeneric;
    query: import("vue-router").LocationQuery;
    hash: string;
    name: import("vue-router").RouteRecordNameGeneric;
    path: string;
    meta: import("vue-router").RouteMeta;
    matched: import("vue-router").RouteLocationMatched[];
    redirectedFrom: import("vue-router").RouteLocationGeneric | undefined;
};
/**
 * NOTE:
 * vue-router v4.x `router.resolve` for a non exists path will output a warning.
 * `router.hasRoute`, which checks for the route can only be a named route.
 * When using the `prefix` strategy, the path specified by `localePath` is specified as a path not prefixed with a locale.
 * This will cause vue-router to issue a warning, so we can work-around by using `router.options.routes`.
 */
export declare function resolve({ router }: CommonComposableOptions, route: RouteLocationPathRaw, strategy: Strategies, locale: Locale): RouteLocationPathRaw | import("vue-router").RouteLocationResolvedGeneric;
