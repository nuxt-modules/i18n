/**
 * Extends interfaces in Vue.js
 */

import Vue from "vue";
import { RawLocation } from "vue-router";

declare module "vue/types/vue" {
  interface Vue {
    localePath(route: RawLocation, locale?: string): string;
    switchLocalePath(locale: string): string;
    getRouteBaseName(route: RawLocation): string;
  }
}
