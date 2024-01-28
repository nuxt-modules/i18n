export default defineAppConfig({
  ui: {
    primary: 'green',
    gray: 'slate',
    footer: {
      bottom: {
        left: 'text-sm text-gray-500 dark:text-gray-400',
        wrapper: 'border-t border-gray-200 dark:border-gray-800'
      }
    }
  },
  seo: {
    siteName: 'Nuxt UI Pro - Docs template'
  },
  header: {
    logo: {
      alt: '',
      light: '',
      dark: ''
    },
    search: true,
    colorMode: true,
    links: [
      {
        icon: 'i-simple-icons-github',
        to: 'https://github.com/nuxt-ui-pro/docs',
        target: '_blank',
        'aria-label': 'Docs template on GitHub'
      }
    ]
  },
  footer: {
    credits: 'Copyright © 2023',
    colorMode: false,
    links: [
      {
        icon: 'i-simple-icons-nuxtdotjs',
        to: 'https://nuxt.com',
        target: '_blank',
        'aria-label': 'Nuxt Website'
      },
      {
        icon: 'i-simple-icons-discord',
        to: 'https://discord.com/invite/ps2h6QT',
        target: '_blank',
        'aria-label': 'Nuxt UI on Discord'
      },
      {
        icon: 'i-simple-icons-x',
        to: 'https://x.com/nuxt_js',
        target: '_blank',
        'aria-label': 'Nuxt on X'
      },
      {
        icon: 'i-simple-icons-github',
        to: 'https://github.com/nuxt/ui',
        target: '_blank',
        'aria-label': 'Nuxt UI on GitHub'
      }
    ]
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/nuxt-ui-pro/docs/edit/main/content',
      links: [
        {
          icon: 'i-heroicons-star',
          label: 'Star on GitHub',
          to: 'https://github.com/nuxt/ui',
          target: '_blank'
        },
        {
          icon: 'i-heroicons-book-open',
          label: 'Nuxt UI Pro docs',
          to: 'https://ui.nuxt.com/pro/guide',
          target: '_blank'
        },
        {
          icon: 'i-simple-icons-nuxtdotjs',
          label: 'Purchase a license',
          to: 'https://ui.nuxt.com/pro/purchase',
          target: '_blank'
        }
      ]
    }
  }
})
