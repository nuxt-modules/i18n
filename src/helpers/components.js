const { readFileSync } = require('fs')
const { COMPONENT_OPTIONS_KEY } = require('./constants')

const acorn = require('acorn')
// const walker = require('acorn-walk')
// const compiler = require('vue-template-compiler')

exports.extractComponentOptions = (path) => {
  let componentOptions = {}
  let Component = compiler.parseComponent(readFileSync(path).toString())
  if (!Component.script || Component.script.content.length < 1) {
    return componentOptions
  }

  const script = Component.script.content

  let pos = script.indexOf(COMPONENT_OPTIONS_KEY)

  if (pos !== -1) {
    let dataStr = ''
    let go = false

    let chk = 0
    let sym = ''

    for (step = pos; step < script.length; step++) {
      sym = script.charAt(step)
      if (sym === '{') {
        go = true
        chk++
      }
      if (sym === '}') chk--
      dataStr += sym

      if (!go && (sym === '\n' || sym === '\r')) {
        break
      }

      if (go && !chk) break

    }

    if (dataStr.length > 0) {
      componentOptions = eval(`({${dataStr}})`)[COMPONENT_OPTIONS_KEY]
    }
  }
/*  const parsed = acorn.parse(script, {
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
  })
  */
  return componentOptions
}
