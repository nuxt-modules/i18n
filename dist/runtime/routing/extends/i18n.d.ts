import type { Composer, ExportedGlobalComposer, I18n, VueI18n } from 'vue-i18n';
type VueI18nExtendOptions = {
    extendComposer: (composer: Composer) => void;
    extendComposerInstance: (instance: Composer | VueI18n | ExportedGlobalComposer, composer: Composer) => void;
};
/**
 * Extend the Vue I18n plugin installation
 *
 * This extends the Composer or Vue I18n (legacy) instance with additional
 * properties and methods, and injects methods into Vue components.
 */
export declare function extendI18n(i18n: I18n, { extendComposer, extendComposerInstance }: VueI18nExtendOptions): any;
export {};
