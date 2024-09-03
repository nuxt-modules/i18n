import type { I18nHeadMetaInfo, MetaAttrs, LocaleObject, I18nHeadOptions } from '#build/i18n.options.mjs';
import type { CommonComposableOptions } from '../../utils.js';
/**
 * Returns localized head properties for locale-related aspects.
 *
 * @param options - An options, see about details {@link I18nHeadOptions}.
 *
 * @returns The localized {@link I18nHeadMetaInfo | head properties}.
 *
 * @public
 */
export declare function localeHead(common: CommonComposableOptions, { addDirAttribute, addSeoAttributes: seoAttributes, identifierAttribute: idAttribute }: I18nHeadOptions): I18nHeadMetaInfo;
export declare function getHreflangLinks(common: CommonComposableOptions, locales: LocaleObject[], idAttribute: NonNullable<I18nHeadOptions['identifierAttribute']>): MetaAttrs[];
export declare function getCanonicalUrl(common: CommonComposableOptions, baseUrl: string, seoAttributes: I18nHeadOptions['addSeoAttributes']): string;
export declare function getCanonicalLink(common: CommonComposableOptions, idAttribute: NonNullable<I18nHeadOptions['identifierAttribute']>, seoAttributes: I18nHeadOptions['addSeoAttributes']): {
    [x: string]: string;
    rel: string;
    href: string;
}[];
export declare function getOgUrl(common: CommonComposableOptions, idAttribute: NonNullable<I18nHeadOptions['identifierAttribute']>, seoAttributes: I18nHeadOptions['addSeoAttributes']): {
    [x: string]: string;
    property: string;
    content: string;
}[];
export declare function getCurrentOgLocale(currentLocale: LocaleObject, currentLanguage: string | undefined, idAttribute: NonNullable<I18nHeadOptions['identifierAttribute']>): {
    [x: string]: string;
    property: string;
    content: string;
}[];
export declare function getAlternateOgLocales(locales: LocaleObject[], currentLanguage: string | undefined, idAttribute: NonNullable<I18nHeadOptions['identifierAttribute']>): {
    [x: string]: string;
    property: string;
    content: string;
}[];
