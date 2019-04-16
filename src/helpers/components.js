const { readFileSync } = require('fs')
const { COMPONENT_OPTIONS_KEY } = require('./constants')

// const acorn = require('acorn')
// const walker = require('acorn-walk')
const compiler = require('vue-template-compiler')

exports.extractComponentOptions = (path) => {
  let componentOptions = {}
  let Component = compiler.parseComponent(readFileSync(path).toString())
  if (!Component.script || Component.script.content.length < 1) {
    return componentOptions
  }

  const script = Component.script.content

  let pos = script.indexOf(COMPONENT_OPTIONS_KEY)
  let data_str = ''
  let go = false
  let chk = 0
  let sym = ''
  if (pos !== -1) {

    for (step = pos; step < script.length; step++) {
      sym = script.charAt(step)
      if (sym === '{') {
        go = true
        chk++
      }
      if (sym === '}') chk--
      data_str += sym
      if (go && !chk) break

    }
  }

  if (data_str.length > 0) {
    componentOptions = eval(`({${data_str}})`)[COMPONENT_OPTIONS_KEY]
  }

  /*  
  const parsed = acorn.parse(script, {
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
