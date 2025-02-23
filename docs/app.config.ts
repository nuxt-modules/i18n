export default defineAppConfig({
  legacy: {
    ui: {
      primary: 'green',
      neutral: 'slate'
    }
  },
  default: {
    ui: {
      primary: 'green',
      neutral: 'zinc'
    }
  },
  theme: {
    radius: 0.25
  },
  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc'
    }
  },
  uiPro: {
    footer: {
      bottom: {
        left: 'text-sm text-gray-500 dark:text-gray-400',
        wrapper: 'border-t border-gray-200 dark:border-gray-800'
      }
    }
    // content: {
    //   prose: {
    //     code: {
    //       icon: {
    //         env: 'vscode-icons:file-type-dotenv'
    //       }
    //     }
    //   }
    // }
  },
  seo: { siteName: '@nuxtjs/i18n' },
  header: {
    search: true,
    colorMode: true,
    links: [
      {
        icon: 'i-simple-icons-github',
        to: 'https://github.com/nuxt-modules/i18n',
        target: '_blank',
        'aria-label': 'Nuxt i18n module'
      }
    ]
  },
  footer: {
    credits: `Copyright © ${new Date().getFullYear()}`,
    colorMode: false,
    links: [
      {
        icon: 'i-simple-icons-nuxtdotjs',
        to: 'https://nuxt.com',
        target: '_blank',
        'aria-label': 'Nuxt Website'
      },
      {
        icon: 'i-simple-icons-github',
        to: 'https://github.com/nuxt-modules/i18n',
        target: '_blank',
        'aria-label': 'Nuxt i18n module'
      }
    ]
  },
  toc: {
    title: 'On this page',
    bottom: {
      edit: 'https://github.com/nuxt-modules/i18n/edit/main/docs/content'
    }
  }
})
