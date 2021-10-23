import { readFileSync } from 'fs'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { formatMessage } from '../templates/utils-common'
import { COMPONENT_OPTIONS_KEY } from './constants'

/**
 * Extracts nuxtI18n component options for given component file path.
 *
 * @typedef {Required<Pick<import('../../types/vue').NuxtI18nComponentOptions, 'locales' | 'paths'>>} ComputedPageOptions
 *
 * @param {import('@nuxt/types/config/router').NuxtRouteConfig['component']} component
 * @param {import('vue-template-compiler')['parseComponent']} parseComponent
 * @return {ComputedPageOptions | false}
 */
export function extractComponentOptions (component, parseComponent) {
  if (typeof (component) !== 'string') {
    return false
  }

  /** @type {ComputedPageOptions | false} */
  let componentOptions = {
    locales: [],
    paths: {}
  }

  let contents
  try {
    contents = readFileSync(component).toString()
  } catch (error) {
    console.warn(formatMessage(`Couldn't read page component file (${/** @type {Error} */(error).message})`))
  }

  if (!contents) {
    return componentOptions
  }

  const Component = parseComponent(contents)

  if (!Component.script || Component.script.content.length < 1) {
    return componentOptions
  }

  const script = Component.script.content

  try {
    const parsed = parse(script, {
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
        // @ts-ignore
        if (path.node.type === 'Property') {
          // @ts-ignore
          if (path.node.key.name === COMPONENT_OPTIONS_KEY) {
            // @ts-ignore
            const data = script.substring(path.node.start, path.node.end)
            componentOptions = Function(`return ({${data}})`)()[COMPONENT_OPTIONS_KEY] // eslint-disable-line
          }
        }
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(formatMessage(`Error parsing "${COMPONENT_OPTIONS_KEY}" component option in file "${component}"`))
  }

  return componentOptions
}
