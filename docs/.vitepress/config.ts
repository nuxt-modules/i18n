import { defineConfig } from 'vitepress'

const gettingStarted = {
  text: 'Getting Started',
  items: [
    { text: 'Setup', link: '/getting-started/setup' },
    { text: 'Basic usage', link: '/getting-started/basic-usage' }
  ]
}

const guides = {
  text: 'Guides',
  items: [
    { text: 'Routing stratagies', link: '/guide/routing-strategies' },
    { text: 'Runtime hooks', link: '/guide/runtime-hooks' },
    { text: 'Custom paths', link: '/guide/custom-paths' },
    { text: 'Ignoring localized routes', link: '/guide/ignoring-localized-routes' },
    { text: 'Browser language detection', link: '/guide/browser-language-detection' },
    { text: 'SEO', link: '/guide/seo' },
    { text: 'Lazy-load translations', link: '/guide/lazy-load-translations' },
    { text: 'Lang switcher', link: '/guide/lang-switcher' },
    { text: 'Different domains', link: '/guide/different-domains' },
    { text: 'Locale fallback', link: '/guide/locale-fallback' },
    { text: 'Per-component translations', link: '/guide/per-component-translations' },
    { text: 'Extending messages hook', link: '/guide/extend-messages' },
    { text: 'Extending pages', link: '/guide/extend-pages' },
    { text: 'Layers', link: '/guide/layers' },
    { text: 'Server-side Translations', link: '/guide/server-side-translations' },
    { text: 'Migration guide', link: '/guide/migrating' }
  ]
}

const options = {
  text: 'Options',
  items: [
    { text: 'Vue I18n', link: '/options/vue-i18n' },
    { text: 'Routing', link: '/options/routing' },
    { text: 'Lazy', link: '/options/lazy' },
    { text: 'Browser', link: '/options/browser' },
    { text: 'Domain', link: '/options/domain' },
    { text: 'Compilation', link: '/options/compilation' },
    { text: 'Bundle', link: '/options/bundle' },
    { text: 'Custom block', link: '/options/custom-block' },
    { text: 'Runtime config', link: '/options/runtime-config' },
    { text: 'Misc', link: '/options/misc' }
  ]
}

const api = {
  text: 'API',
  items: [
    { text: 'Composables', link: '/api/composables' },
    { text: 'Components', link: '/api/components' },
    { text: 'Compiler macros', link: '/api/compiler-macros' },
    { text: 'Vue i18n', link: '/api/vue-i18n' },
    { text: 'Vue', link: '/api/vue' },
    { text: 'Nuxt', link: '/api/nuxt' }
  ]
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'nuxt/i18n',
  description: 'Internationalization for Nuxt Applications.',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/public/logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/public/logo.png' }]
  ],
  themeConfig: {
    search: {
      provider: 'local'
    },
    logo: '/icon.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      gettingStarted,
      guides,
      options,
      api,
      { text: 'Roadmap', link: '/roadmap' },
      { text: 'v7 Docs', link: '/v7/setup' }
    ],

    sidebar: {
      '/': [gettingStarted, guides, options, api],
      '/v7/': [
        {
          text: 'v7',
          items: [
            { text: 'Setup', link: '/v7/setup' },
            { text: 'Basic usage', link: '/v7/basic-usage' },
            { text: 'Options', link: '/v7/options-reference' },
            { text: 'Callbacks', link: '/v7/callbacks' },
            { text: 'Routing', link: '/v7/routing' },
            { text: 'Strategies', link: '/v7/strategies' },
            { text: 'Custom route paths', link: '/v7/custom-paths' },
            { text: 'Ignoring localized routes', link: '/v7/ignoring-localized-routes' },
            { text: 'Browser language detection', link: '/v7/browser-language-detection' },
            { text: 'SEO', link: '/v7/seo' },
            { text: 'Lazy-load translations', link: '/v7/lazy-load-translations' },
            { text: 'Lang switcher', link: '/v7/lang-switcher' },
            { text: 'Different domains', link: '/v7/different-domains' },
            { text: 'Locale fallback', link: '/v7/locale-fallback' },
            { text: 'Per-component translations', link: '/v7/per-component-translations' },
            { text: 'Extending messages hook', link: '/v7/extend-messages' },
            { text: 'Migration guide', link: '/v7/migrating' },
            { text: 'API Refrences', link: '/v7/api' }
          ]
        }
      ]
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }]
  }
})
