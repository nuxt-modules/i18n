export default defineI18nConfig(() => {
  const config = useRuntimeConfig()

  return {
    legacy: false,
    locale: 'en',
    messages: {
      fr: {
        home: 'Accueil',
        about: 'À propos',
        posts: 'Articles',
        categories: 'Catégories',
        welcome: 'Bienvenue',
        profile: 'Profil',
        aboutSite: 'À propos de ce site',
        snakeCaseText: "@.snakeCase:{'aboutSite'}",
        pascalCaseText: "@.pascalCase:{'aboutSite'}",
        hello: 'Bonjour le monde!',
        modifier: "@.snakeCase:{'hello'}",
        helloMessage: 'Bonjour {name}!'
      },
      en: {
        home: 'Homepage',
        about: 'About us',
        posts: 'Posts',
        categories: 'Categories',
        welcome: 'Welcome',
        profile: 'Profile',
        hello: 'Hello world!',
        modifier: "@.snakeCase:{'hello'}",
        fallbackMessage: 'This is the fallback message!',
        runtimeKey: config.public.runtimeValue,
        helloMessage: 'Hello {name}!'
      },
      nl: {
        aboutSite: 'Over deze site',
        snakeCaseText: "@.snakeCase:{'aboutSite'}",
        pascalCaseText: "@.pascalCase:{'aboutSite'}"
      }
    },
    modifiers: {
      // @ts-ignore
      snakeCase: (str: string) => str.split(' ').join('-')
    }
  }
})
