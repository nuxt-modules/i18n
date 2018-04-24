module.exports = {
  cleanUpScripts: (html) => {
    const regexp = new RegExp(/<script[^>]*>.*<\/script>/, 'ig')
    return html.replace(regexp, '')
  }
}
