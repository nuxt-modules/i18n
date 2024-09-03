import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from 'vue-router';
export type GetLocaleFromRouteFunction = (route: RouteLocationNormalizedLoaded | RouteLocationNormalized | string) => string;
export declare function createLocaleFromRouteGetter(): GetLocaleFromRouteFunction;
