const { readFileSync } = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
// Must not be an explicit dependency to avoid version mismatch issue.
// See https://github.com/nuxt-community/i18n-module/issues/297
const compiler = require('vue-template-compiler')
const { COMPONENT_OPTIONS_KEY, MODULE_NAME } = require('./constants')

/**
 * Extracts nuxtI18n component options for given component file path.
 *
 * @param {string} path The path to the component file
 * @return {Record<string, any>}
 */
exports.extractComponentOptions = path => {
  let componentOptions = {}
  let contents
  try {
    contents = readFileSync(path).toString()
  } catch (error) {
    console.warn(`[${MODULE_NAME}] Couldn't read page component file (${error.message})`)
  }

  if (!contents) {
    return componentOptions
  }

  const Component = compiler.parseComponent(contents)

  if (!Component.script || Component.script.content.length < 1) {
    return componentOptions
  }

  const script = Component.script.content

  try {
    const parsed = parser.parse(script, {
      sourceType: 'module',
      plugins: [
        'nullishCoalescingOperator',
        'optionalChaining',
        'classProperties',
        'decorators-legacy',
        'dynamicImport',
        'estree',
        'exportDefaultFrom',
        'typescript'
      ]
    })

    traverse(parsed, {
      enter (path) {
        if (path.node.type === 'Property') {
          if (path.node.key.name === COMPONENT_OPTIONS_KEY) {
            const data = script.substring(path.node.start, path.node.end)
            componentOptions = Function(`return ({${data}})`)()[COMPONENT_OPTIONS_KEY] // eslint-disable-line
          }
        }
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[' + MODULE_NAME + `] Error parsing "${COMPONENT_OPTIONS_KEY}" component option in file "${path}".`)
  }

  return componentOptions
}
