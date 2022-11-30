export default defineAppConfig({
  docus: {
    title: '@nuxtjs/i18n',
    description: 'Module i18n (Internationalization) for Nuxt',
    url: 'https://v8.i18n.nuxtjs.org',
    layout: 'default',
    socials: {
      github: 'nuxt-modules/i18n'
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
      src: '/cover.png',
      alt: 'Module i18n for Nuxt'
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
