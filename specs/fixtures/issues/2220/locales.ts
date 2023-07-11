export default [
  {
    code: 'en',
    name: 'English'
  },
  {
    code: 'ru',
    name: 'Русский'
  }
].map(lang => ({ file: lang.code + '.json', ...lang }))
