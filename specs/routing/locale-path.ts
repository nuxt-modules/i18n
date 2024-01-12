import { STRATEGIES } from '../../src/constants'
import type { Strategies } from '../../src/types'
import { getText, renderPage } from '../helper'

export async function localePathTests(strategy: Strategies) {
  const prefix = strategy !== STRATEGIES.NO_PREFIX

  // Helper function to adjust checked path based on `strategy`
  const p = (path: string = '/', locale: string = 'en') => {
    if (!prefix) return path.startsWith('/') ? path : '/' + path
    const resolvedRoute = path === '/' ? undefined : path

    return ['/', locale, resolvedRoute].filter(Boolean).join('')
  }

  const { page, consoleLogs } = await renderPage(p('/'))

  // path
  expect(await getText(page, '#locale-path .index')).toEqual(p('/'))
  expect(await getText(page, '#locale-path .index-ja')).toEqual(p('/', 'ja'))

  // name
  expect(await getText(page, '#locale-path .about')).toEqual(p('/about'))
  expect(await getText(page, '#locale-path .about-ja-path')).toEqual(p('/about', 'ja'))

  // pathMatch
  // TODO: fix named paths
  expect(await getText(page, '#locale-path .not-found')).toEqual(p('/'))
  expect(await getText(page, '#locale-path .not-found-ja')).toEqual(p('', 'ja'))

  // // object
  expect(await getText(page, '#locale-path .about-ja-name-object')).toEqual(p('/about', 'ja'))

  // // omit name & path
  expect(await getText(page, '#locale-path .state-foo')).toEqual(p('/'))

  // // preserve query parameters
  expect(await getText(page, '#locale-path .query-foo')).toEqual(p('?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-index')).toEqual(p('?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-name-about')).toEqual(p('/about?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-path-about')).toEqual(p('/about?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-string')).toEqual(p('?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-string-about')).toEqual(p('/about?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-test-string')).toEqual(p('/about?foo=1&test=2'))
  if (prefix) {
    expect(await getText(page, '#locale-path .query-foo-path-param')).toEqual(p('/path/as a test?foo=bar+sentence'))
  } else {
    // TODO: fix localePath escapes paths for `no_prefix` strategy
    expect(await getText(page, '#locale-path .query-foo-path-param')).not.toEqual(p('/path/as a test?foo=bar+sentence'))
  }
  expect(await getText(page, '#locale-path .query-foo-path-param-escaped')).toEqual(
    p('/path/as%20a%20test?foo=bar+sentence')
  )
  expect(await getText(page, '#locale-path .hash-path-about')).toEqual(p('/about#foo=bar'))

  // undefined path
  expect(await getText(page, '#locale-path .undefined-path')).toEqual(p('/vue-i18n'))
  // undefined name
  expect(await getText(page, '#locale-path .undefined-name')).toEqual('')

  // for vue-router deprecation
  // https://github.com/vuejs/router/blob/main/packages/router/CHANGELOG.md#414-2022-08-22
  expect(consoleLogs.find(log => log.text.includes('Discarded invalid param(s)'))).toBeFalsy()
}
