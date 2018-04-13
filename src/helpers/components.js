import { readFileSync } from 'fs'
import acorn from 'acorn'
import walker from 'acorn/dist/walk'

import { COMPONENT_OPTIONS_KEY } from './constants'

export const extractComponentOptions = (path) => {
  let componentOptions = {}
  const pattern = new RegExp(/<script[^>]*>((.|\n)+)<\/script>/, 'i')
  const content = readFileSync(path).toString()
  const matches = content.match(pattern)
  if (!matches || matches.length < 2) {
    return componentOptions
  }
  const script = matches[1]
  const parsed = acorn.parse(script, {
    ecmaVersion: 8,
    sourceType: 'module'
  })
  walker.simple(parsed, {
    Property (node) {
      if (node.key.name === COMPONENT_OPTIONS_KEY) {
        const data = script.substring(node.start, node.end)
        componentOptions = eval(`({${data}})`).i18n // eslint-disable-line
      }
    }
  })
  return componentOptions
}
