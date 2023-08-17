export default defineAppConfig({
  docus: {
    title: '@nuxtjs/i18n',
    description: 'I18n (Internationalization) module for Nuxt',
    url: 'https://v8.i18n.nuxtjs.org',
    layout: 'default',
    image: '/cover.png',
    socials: {
      github: 'nuxt-modules/i18n'
    },
    github: {
      branch: 'next',
      repo: 'nuxt-modules/i18n',
      owner: 'nuxt-modules',
      dir: 'docs/content',
      edit: true
    },
    aside: {
      level: 1
    },
    cover: {
      src: '/cover.png',
      alt: 'I18n module for Nuxt'
    },
    header: {
      logo: true,
      showLinkIcon: false
    },
    footer: {
      credits: {
        icon: 'IconDocus',
        text: 'Powered by Docus',
        href: 'https://docus.com'
      },
      icons: [
        {
          label: 'Nuxt',
          href: 'https://nuxt.com',
          component: 'IconNuxt'
        },
        {
          label: 'Vue Telescope',
          href: 'https://vuetelescope.com',
          component: 'IconVueTelescope'
        }
      ]
    }
  }
})
