const fs = require('fs')
const { COMPONENT_OPTIONS_KEY, MODULE_NAME } = require('./constants')

const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default

// Must not be an explicit dependency to avoid version mismatch issue.
// See https://github.com/nuxt-community/nuxt-i18n/issues/297
const compiler = require('vue-template-compiler')

exports.extractComponentOptions = (src, isScript = false) => {
  let componentOptions = {}
  let script = ''

  if (isScript !== true) {
    const Component = compiler.parseComponent(fs.readFileSync(src).toString())

    if (!Component.script || Component.script.content.length < 1) {
      return componentOptions
    }

    script = Component.script.content
  } else {
    script = fs.readFileSync(src).toString()
  }

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
        if (path.node.type === 'ImportDeclaration') {
          // Use of eval is ok as it is only called at build
          const srcAttr = eval(script.substring(path.node.source.start, path.node.source.end)) // eslint-disable-line
          if (srcAttr === './scripts' || srcAttr === './scripts.ts' || srcAttr === './scripts.js') {
            const dirContents = fs.readdirSync(src.substr(0, src.lastIndexOf('/')))
            const filename = dirContents.find((filename) => {
              if (filename.includes(srcAttr.substring(2))) {
                return filename
              }
            })
            componentOptions = exports.extractComponentOptions(src.substr(0, src.lastIndexOf('/')) + '/' + filename, true)
          }
        }

        if (path.node.type === 'ClassProperty' && path.node.key.name === COMPONENT_OPTIONS_KEY) {
          const data = script.substring(path.node.value.start, path.node.value.end)
          // Use of eval is ok as it is only called at build
          componentOptions = eval(`(${data.replace(/\s/g, '')})`) // eslint-disable-line
          return
        }

        if (path.node.type === 'Property') {
          if (path.node.key.name === COMPONENT_OPTIONS_KEY) {
            const data = script.substring(path.node.start, path.node.end)
            componentOptions = Function(`return ({${data}})`)()[COMPONENT_OPTIONS_KEY] // eslint-disable-line
          }
        }
      }
    })
  } catch (error) {
    // @todo we should handle this error better as the try catch can fail for a large number of reasons.
    // eslint-disable-next-line no-console
    console.warn('[' + MODULE_NAME + `] Error parsing "${COMPONENT_OPTIONS_KEY}" component option in file "${src}".`)
  }

  return componentOptions
}
