module.exports = {
  title: 'nuxt-i18n',
  description: 'i18n for Nuxt',
  base: '/nuxt-i18n/',
  themeConfig: {
    repo: 'nuxt-community/nuxt-i18n',
    editLinks: true,
    docsDir: 'docs',
    locales: {
      '/': {
        label: 'English',
        selectText: 'Languages',
        editLinkText: 'Edit this page on GitHub',
        sidebar: {
          '/': sidebarLinks('en')
        }
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
      'page/': 'Introduction'
    }
  }

  const localePageTitle = (page) => {
    if (translations[locale][`page/${page}`]) {
      return [page, translations[locale][`page/${page}`]]
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
        'migrating',
      ].map(child => localePageTitle(child))
    }
  ]

  return toc
}
