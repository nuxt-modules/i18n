export default defineAppConfig({
  default: {
    ui: {
      primary: 'green',
      gray: 'zinc'
    }
  },
  legacy: {
    ui: {
      primary: 'green',
      gray: 'slate'
    }
  },
  ui: {
    primary: 'green',
    gray: 'zinc',
    footer: {
      bottom: {
        left: 'text-sm text-gray-500 dark:text-gray-400',
        wrapper: 'border-t border-gray-200 dark:border-gray-800'
      }
    },
    content: {
      prose: {
        code: {
          icon: {
            env: 'vscode-icons:file-type-dotenv'
          }
        }
      }
    }
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
    title: 'Table of Contents',
    bottom: {
      edit: 'https://github.com/nuxt-modules/i18n/docs/edit/main/content'
    }
  }
})
