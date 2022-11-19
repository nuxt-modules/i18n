export default defineAppConfig({
  docus: {
    title: '@nuxtjs/i18n',
    description: 'I18n (Internationalization) for your Nuxt Application',
    url: 'https://v8.i18n.nuxtjs.org',
    layout: 'default',
    socials: {
      github: 'nuxt-community/i18n-module'
    },
    github: {
      root: 'content',
      edit: true,
      releases: false
    },
    aside: {
      level: 0,
      exclude: []
    },
    header: {
      title: false,
      logo: true,
      showLinkIcon: false
    },
    cover: {
      src: '/preview.png',
      alt: 'I18n for Nuxt developers'
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
