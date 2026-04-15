import pkg from "../package.json";

export default defineNuxtConfig({
  extends: ["docus"],
  modules: ["@nuxt/scripts", "nuxt-llms"],
  routeRules: {
    // default
    "/": { prerender: true },
    "/docs": { redirect: "/docs/getting-started" },
  },

  // SEO
  site: { name: 'Nuxt I18n', url: "https://i18n.nuxtjs.org" },

  image: {
    domains: ["raw.githubusercontent.com"],
  },

  nitro: {
    prerender: {
      crawlLinks: true,
    },
  },

  runtimeConfig: {
    public: {
      version: pkg.version,
      scripts: {
        cloudflareWebAnalytics: {
          // NUXT_PUBLIC_SCRIPTS_CLOUDFLARE_WEB_ANALYTICS_TOKEN
          token: "",
        },
      },
    },
  },

  llms: {
    domain: "https://i18n.nuxtjs.org",
    title: "Nuxt i18n Docs",
    description:
      "Nuxt i18n is a powerful internationalization (i18n) module for Nuxt powered by Vue i18n.",
    full: {
      title: "Nuxt i18n Docs",
      description:
        "The complete Nuxt i18n documentation written in Markdown (MDC syntax).",
    },
  },

  css: ["~/assets/css/main.css"],

  typescript: { strict: false },

  $development: {
    scripts: {
      enabled: false,
    },
  },

  scripts: {
    registry: {
      cloudflareWebAnalytics: true,
    },
  },

  compatibilityDate: "2024-09-26",
});
