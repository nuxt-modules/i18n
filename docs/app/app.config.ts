export default defineAppConfig({
  // Docus locale
  docus: {
    locale: "en",
  },

  // Theme
  ui: {
    colors: {
      primary: "green",
      neutral: "zinc",
    },
  },
  theme: {
    radius: 0.25,
  },

  // SEO
  seo: {
    siteName: "@nuxtjs/i18n",
  },

  // Header
  header: {
    logo: {
      light: "/logo-light.svg",
      dark: "/logo-dark.svg",
      alt: "Nuxt i18n",
    },
  },

  // Social links
  socials: {
    github: "https://github.com/nuxt-modules/i18n",
    nuxt: "https://nuxt.com",
  },

  // GitHub integration (edit this page, report issue)
  github: {
    url: "https://github.com/nuxt-modules/i18n",
    branch: "main",
    rootDir: "docs",
  },

  // Table of Contents
  toc: {
    title: "On this page",
    bottom: {
      title: "Community",
      links: [
        {
          icon: "i-lucide-star",
          label: "Star on GitHub",
          to: "https://github.com/nuxt-modules/i18n",
          target: "_blank",
        },
      ],
    },
  },
});
