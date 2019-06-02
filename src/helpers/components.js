const { readFileSync } = require('fs')
const { COMPONENT_OPTIONS_KEY } = require('./constants')

const acorn = require('acorn')
const dynamicImport = require('acorn-dynamic-import')
const inject = require('acorn-dynamic-import/lib/walk')
const walker = inject.default(require('acorn-walk'))
// Must not be an explicit dependency to avoid version mismatch issue.
// See https://github.com/nuxt-community/nuxt-i18n/issues/297
const compiler = require('vue-template-compiler')

exports.extractComponentOptions = (path) => {
  let componentOptions = {}
  let Component = compiler.parseComponent(readFileSync(path).toString())
  if (!Component.script || Component.script.content.length < 1) {
    return componentOptions
  }

  const script = Component.script.content
  const parsed = acorn.Parser.extend(dynamicImport.default).parse(script, {
    ecmaVersion: 10,
    sourceType: 'module'
  })
  walker.simple(parsed, {
    Property (node) {
      if (node.key.name === COMPONENT_OPTIONS_KEY) {
        const data = script.substring(node.start, node.end)
        componentOptions = eval(`({${data}})`)[COMPONENT_OPTIONS_KEY] // eslint-disable-line
      }
    }
  }, walker.base)

  return componentOptions
}
