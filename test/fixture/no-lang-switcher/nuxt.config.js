const { resolve } = require('path')

module.exports = {
  ...require('../base.config.js'),
  buildDir: resolve(__dirname, '.nuxt'),
  srcDir: __dirname
}
