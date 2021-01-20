import { withDocus } from 'docus'

export default withDocus({
  i18n: {
    locales: () => [{
      code: 'es',
      iso: 'es-ES',
      file: 'es-ES.js',
      name: 'Español'
    }, {
      code: 'en',
      iso: 'en-US',
      file: 'en-US.js',
      name: 'English'
    }],
    defaultLocale: 'en'
  }
})
