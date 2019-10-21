module.exports = {
  title: 'nuxt-i18n',
  description: 'i18n for Nuxt',
  base: '/nuxt-i18n/',
  locales: {
    '/': {
      lang: 'en-US',
      title: 'nuxt-i18n'
    },
    '/es/': {
      lang: 'es-EC',
      title: 'Guía de nuxt-i18n'
    }
  },
  themeConfig: {
    repo: 'nuxt-community/nuxt-i18n',
    editLinks: true,
    docsDir: 'docs',
    locales: {
      '/': {
        label: 'English',
        selectText: 'Languages',
        editLinkText: 'Edit this page on GitHub',
        nav: [
          { text: 'Guide', link: '/' },
          { text: 'API Reference', link: '/api/' },
          { text: 'Release Notes', link: 'https://github.com/nuxt-community/nuxt-i18n/blob/master/CHANGELOG.md' }
        ],
        sidebar: {
          '/': sidebarLinks('en')
        }
      },
      '/es/': {
        label: 'Español',
        selectText: 'Idiomas',
        editLinkText: 'Edite esta página en GitHub',
        nav: [
          { text: 'Guía', link: '/es/' },
          { text: 'Referencias API', link: '/es/api/' },
          { text: 'Notas de la versión', link: 'https://github.com/nuxt-community/nuxt-i18n/blob/master/CHANGELOG.md' }
        ],
        sidebar: {
          '/es/': sidebarLinks('es')
        },
      },
    }
  }
}


function sidebarLinks (locale) {
  const translations = {
    en: {
      groups: {
        main: 'Guide'
      },
      '/': 'Introduction'
    },
    es: {
      groups: {
        main: 'Guía'
      },
      '/': 'Introducción',
      '/setup': 'Configuración',
      '/basic-usage': 'Uso Básico',
      '/options-reference': 'Opciones'
    }
  }

  const localePageTitle = (page) => {
    if (translations[locale][`/${page}`]) {
      return [page, translations[locale][`/${page}`]]
    }
    return page
  }

  const toc = [
    {
      title: translations[locale].groups.main,
      collapsable: false,
      children: [
        '',
        'setup',
        'basic-usage',
        'options-reference',
        'callbacks',
        'routing',
        'browser-language-detection',
        'seo',
        'lazy-load-translations',
        'lang-switcher',
        'different-domains',
        'vue-i18n-loader',
        'migrating',
      ].map(child => localePageTitle(child))
    }
  ]

  return toc
}
