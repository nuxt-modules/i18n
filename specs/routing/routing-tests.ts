/// <reference types="vitest/globals" />

import { STRATEGIES } from '../../src/constants'
import type { Strategies } from '../../src/types'
import { getText, gotoPath, renderPage, waitForURL } from '../helper'
import { url } from '../utils'

export async function localePathTests(strategy: Strategies) {
  const prefix = strategy !== STRATEGIES.NO_PREFIX

  // helper function to add prefix to path based on `strategy`
  const prefixPath = (path: string = '/', locale: string = 'en') => {
    if (!prefix) return path.startsWith('/') ? path : '/' + path
    const resolvedRoute = path === '/' ? undefined : path

    return ['/', locale, resolvedRoute].filter(Boolean).join('')
  }

  const { page, consoleLogs } = await renderPage(prefixPath('/'))

  // path
  expect(await getText(page, '#locale-path .index')).toEqual(prefixPath('/'))
  expect(await getText(page, '#locale-path .index-ja')).toEqual(prefixPath('/', 'ja'))

  // name
  expect(await getText(page, '#locale-path .about')).toEqual(prefixPath('/about'))
  expect(await getText(page, '#locale-path .about-ja-path')).toEqual(prefixPath('/about', 'ja'))

  // pathMatch
  // TODO: fix named paths https://github.com/nuxt-modules/i18n/issues/2581
  expect(await getText(page, '#locale-path .not-found')).toEqual(prefixPath('/'))
  expect(await getText(page, '#locale-path .not-found-ja')).toEqual(prefixPath('', 'ja'))

  // // object
  expect(await getText(page, '#locale-path .about-ja-name-object')).toEqual(prefixPath('/about', 'ja'))

  // // omit name & path
  expect(await getText(page, '#locale-path .state-foo')).toEqual(prefixPath('/'))

  // // preserve query parameters
  expect(await getText(page, '#locale-path .query-foo')).toEqual(prefixPath('?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-index')).toEqual(prefixPath('?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-name-about')).toEqual(prefixPath('/about?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-path-about')).toEqual(prefixPath('/about?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-string')).toEqual(prefixPath('?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-string-about')).toEqual(prefixPath('/about?foo=1'))
  expect(await getText(page, '#locale-path .query-foo-test-string')).toEqual(prefixPath('/about?foo=1&test=2'))
  // if (strategy === 'no_prefix') {
  //   // TODO: fix localePath escapes paths for `no_prefix` strategy
  //   // unexpectedly resolves to /path/as%20a%20test?foo=bar+sentence
  //   expect(await getText(page, '#locale-path .query-foo-path-param')).not.toEqual(
  //     prefixPath('/path/as a test?foo=bar+sentence')
  //   )
  // } else {
  expect(await getText(page, '#locale-path .query-foo-path-param')).toEqual(
    prefixPath('/path/as a test?foo=bar+sentence')
  )
  // }
  expect(await getText(page, '#locale-path .query-foo-path-param-escaped')).toEqual(
    prefixPath('/path/as%20a%20test?foo=bar+sentence')
  )
  expect(await getText(page, '#locale-path .hash-path-about')).toEqual(prefixPath('/about#foo=bar'))

  // undefined path
  expect(await getText(page, '#locale-path .undefined-path')).toEqual(prefixPath('/vue-i18n'))
  // undefined name
  expect(await getText(page, '#locale-path .undefined-name')).toEqual('')

  // external
  expect(await getText(page, '#locale-path .external-link')).toEqual('https://github.com')
  expect(await getText(page, '#locale-path .external-mail')).toEqual('mailto:example@mail.com')
  expect(await getText(page, '#locale-path .external-phone')).toEqual('tel:+31612345678')

  // for vue-router deprecation
  // https://github.com/vuejs/router/blob/main/packages/router/CHANGELOG.md#414-2022-08-22
  expect(consoleLogs.find(log => log.text.includes('Discarded invalid param(s)'))).toBeFalsy()
}

export async function switchLocalePathTests() {
  const { page } = await renderPage('/en')

  expect(await getText(page, '#switch-locale-path .en')).toEqual('/en')
  expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja')
  expect(await getText(page, '#switch-locale-path .undefined')).toEqual('')

  await gotoPath(page, '/ja/about')

  expect(await getText(page, '#switch-locale-path .en')).toEqual('/en/about')
  expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/about')

  await gotoPath(page, '/ja/about?foo=1&test=2')
  expect(await getText(page, '#switch-locale-path .en')).toEqual('/en/about?foo=1&test=2')
  expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/about?foo=1&test=2')

  await page.goto(url('/ja/about?foo=bär&four=四&foo=bar'))
  await waitForURL(page, '/ja/about?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')
  expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/about?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')
  expect(await getText(page, '#switch-locale-path .en')).toEqual('/en/about?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')

  await page.goto(url('/ja/about?foo=bär&four=四'))
  await waitForURL(page, '/ja/about?foo=b%C3%A4r&four=%E5%9B%9B')
  expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/about?foo=b%C3%A4r&four=%E5%9B%9B')
  expect(await getText(page, '#switch-locale-path .en')).toEqual('/en/about?foo=b%C3%A4r&four=%E5%9B%9B')

  await gotoPath(page, '/ja/about#foo=bar')
  expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/about#foo=bar')
  expect(await getText(page, '#switch-locale-path .en')).toEqual('/en/about#foo=bar')

  await page.goto(url('/ja/about?foo=é'))
  await waitForURL(page, '/ja/about?foo=%C3%A9')
  expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/about?foo=%C3%A9')

  // TODO: figure out what was being tested originally
  // await gotoPath(page, '/ja/category/1')
  // expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/category/japanese')
  // expect(await getText(page, '#switch-locale-path .en')).toEqual('/en/category/english')

  await page.goto(url('/ja/count/三'))
  await waitForURL(page, '/ja/count/%E4%B8%89')
  expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/count/三')
  expect(await getText(page, '#switch-locale-path .en')).toEqual('/en/count/三')

  await page.goto(url('/ja/count/三?foo=bär&four=四&foo=bar'))
  await waitForURL(page, '/ja/count/%E4%B8%89?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')
  expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/count/三?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')
  expect(await getText(page, '#switch-locale-path .en')).toEqual('/en/count/三?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B')

  // TODO: figure out what was being tested originally
  // await gotoPath(page, '/ja/foo')
  // expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/not-found-japanese')
  // expect(await getText(page, '#switch-locale-path .en')).toEqual('/en/not-found-english')
}

export async function localeLocationTests() {
  const { page } = await renderPage('/en')

  expect(JSON.parse(await getText(page, '#locale-location .index'))).include({
    fullPath: '/en',
    path: '/en',
    name: 'index___en',
    href: '/en'
  })

  expect(JSON.parse(await getText(page, '#locale-location .index-name-ja'))).include({
    fullPath: '/ja',
    path: '/ja',
    name: 'index___ja',
    href: '/ja'
  })

  expect(JSON.parse(await getText(page, '#locale-location .about-name'))).include({
    fullPath: '/en/about',
    path: '/en/about',
    name: 'about___en',
    href: '/en/about'
  })

  expect(JSON.parse(await getText(page, '#locale-location .about-ja'))).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: 'about___ja',
    href: '/ja/about'
  })

  expect(JSON.parse(await getText(page, '#locale-location .about-name-ja'))).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: 'about___ja',
    href: '/ja/about'
  })

  expect(JSON.parse(await getText(page, '#locale-location .path-match-ja'))).include({
    fullPath: '/ja/:pathMatch(.*)*',
    path: '/ja/:pathMatch(.*)*',
    name: 'pathMatch___ja',
    href: '/ja/:pathMatch(.*)*'
  })

  // name
  expect(JSON.parse(await getText(page, '#locale-location .path-match-name'))).include({
    fullPath: '/en',
    path: '/en',
    name: 'pathMatch___en',
    href: '/en'
  })

  expect(JSON.parse(await getText(page, '#locale-location .path-match-name-ja'))).include({
    fullPath: '/ja',
    path: '/ja',
    name: 'pathMatch___ja',
    href: '/ja'
  })

  // object
  expect(JSON.parse(await getText(page, '#locale-location .about-object-ja'))).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: 'about___ja',
    href: '/ja/about'
  })

  // undefined path
  expect(JSON.parse(await getText(page, '#locale-location .undefined-path-ja'))).include({
    fullPath: '/ja/vue-i18n',
    path: '/ja/vue-i18n',
    name: 'pathMatch___ja',
    href: '/ja/vue-i18n'
  })

  // undefined name
  expect(await getText(page, '#locale-location .undefined-name-ja')).toEqual('')
}

export async function localeRouteTests() {
  const { page } = await renderPage('/en')

  expect(JSON.parse(await getText(page, '#locale-route .index'))).include({
    fullPath: '/en',
    path: '/en',
    name: 'index___en',
    href: '/en'
  })

  expect(JSON.parse(await getText(page, '#locale-route .index-name-ja'))).include({
    fullPath: '/ja',
    path: '/ja',
    name: 'index___ja',
    href: '/ja'
  })

  expect(JSON.parse(await getText(page, '#locale-route .about-name'))).include({
    fullPath: '/en/about',
    path: '/en/about',
    name: 'about___en',
    href: '/en/about'
  })

  expect(JSON.parse(await getText(page, '#locale-route .about-ja'))).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: 'about___ja',
    href: '/ja/about'
  })

  expect(JSON.parse(await getText(page, '#locale-route .about-name-ja'))).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: 'about___ja',
    href: '/ja/about'
  })

  expect(JSON.parse(await getText(page, '#locale-route .path-match-ja'))).include({
    fullPath: '/ja/:pathMatch(.*)*',
    path: '/ja/:pathMatch(.*)*',
    name: 'pathMatch___ja',
    href: '/ja/:pathMatch(.*)*'
  })

  // name
  expect(JSON.parse(await getText(page, '#locale-route .path-match-name'))).include({
    fullPath: '/en',
    path: '/en',
    name: 'pathMatch___en',
    href: '/en'
  })

  expect(JSON.parse(await getText(page, '#locale-route .path-match-name-ja'))).include({
    fullPath: '/ja',
    path: '/ja',
    name: 'pathMatch___ja',
    href: '/ja'
  })

  // object
  expect(JSON.parse(await getText(page, '#locale-route .about-object-ja'))).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: 'about___ja',
    href: '/ja/about'
  })

  // undefined path
  expect(JSON.parse(await getText(page, '#locale-route .undefined-path-ja'))).include({
    fullPath: '/ja/vue-i18n',
    path: '/ja/vue-i18n',
    name: 'pathMatch___ja',
    href: '/ja/vue-i18n'
  })

  // undefined name
  expect(await getText(page, '#locale-route .undefined-name-ja')).toEqual('')
}
