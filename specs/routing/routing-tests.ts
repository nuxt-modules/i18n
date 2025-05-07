/// <reference types="vitest/globals" />

import { STRATEGIES } from '../../src/constants'
import type { Strategies } from '../../src/types'
import { gotoPath, renderPage } from '../helper'
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
  expect(await page.locator('#locale-path .index').innerText()).toEqual(prefixPath('/'))
  expect(await page.locator('#locale-path .index-ja').innerText()).toEqual(prefixPath('/', 'ja'))

  // name
  expect(await page.locator('#locale-path .about').innerText()).toEqual(prefixPath('/about'))
  expect(await page.locator('#locale-path .about-ja-path').innerText()).toEqual(prefixPath('/about', 'ja'))

  // pathMatch
  // TODO: fix named paths https://github.com/nuxt-modules/i18n/issues/2581
  expect(await page.locator('#locale-path .not-found').innerText()).toEqual(prefixPath('/'))
  expect(await page.locator('#locale-path .not-found-ja').innerText()).toEqual(prefixPath('', 'ja'))

  // // object
  expect(await page.locator('#locale-path .about-ja-name-object').innerText()).toEqual(prefixPath('/about', 'ja'))

  // // omit name & path
  expect(await page.locator('#locale-path .state-foo').innerText()).toEqual(prefixPath('/'))

  // // preserve query parameters
  expect(await page.locator('#locale-path .query-foo').innerText()).toEqual(prefixPath('?foo=1'))
  expect(await page.locator('#locale-path .query-foo-index').innerText()).toEqual(prefixPath('?foo=1'))
  expect(await page.locator('#locale-path .query-foo-name-about').innerText()).toEqual(prefixPath('/about?foo=1'))
  expect(await page.locator('#locale-path .query-foo-path-about').innerText()).toEqual(prefixPath('/about?foo=1'))
  expect(await page.locator('#locale-path .query-foo-string').innerText()).toEqual(prefixPath('?foo=1'))
  expect(await page.locator('#locale-path .query-foo-string-about').innerText()).toEqual(prefixPath('/about?foo=1'))
  expect(await page.locator('#locale-path .query-foo-test-string').innerText()).toEqual(
    prefixPath('/about?foo=1&test=2')
  )

  expect(await page.locator('#locale-path .query-foo-path-param').innerText()).toEqual(
    prefixPath('/path/as a test?foo=bar+sentence')
  )
  expect(await page.locator('#locale-path .query-foo-path-param-escaped').innerText()).toEqual(
    prefixPath('/path/as%20a%20test?foo=bar+sentence')
  )
  expect(await page.locator('#locale-path .hash-path-about').innerText()).toEqual(prefixPath('/about#foo=bar'))

  // undefined path
  expect(await page.locator('#locale-path .undefined-path').innerText()).toEqual(prefixPath('/vue-i18n'))
  // undefined name
  expect(await page.locator('#locale-path .undefined-name').innerText()).toEqual('')

  // external
  expect(await page.locator('#locale-path .external-link').innerText()).toEqual('https://github.com')
  expect(await page.locator('#locale-path .external-mail').innerText()).toEqual('mailto:example@mail.com')
  expect(await page.locator('#locale-path .external-phone').innerText()).toEqual('tel:+31612345678')

  // for vue-router deprecation
  // https://github.com/vuejs/router/blob/main/packages/router/CHANGELOG.md#414-2022-08-22
  expect(consoleLogs.find(log => log.text.includes('Discarded invalid param(s)'))).toBeFalsy()
}

export async function switchLocalePathTests() {
  const { page } = await renderPage('/en')

  expect(await page.locator('#switch-locale-path .en').innerText()).toEqual('/en')
  expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja')
  expect(await page.locator('#switch-locale-path .undefined').innerText()).toEqual('')

  await gotoPath(page, '/ja/about')
  expect(await page.locator('#switch-locale-path .en').innerText()).toEqual('/en/about')
  expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja/about')

  await gotoPath(page, '/ja/about?foo=1&test=2')
  expect(await page.locator('#switch-locale-path .en').innerText()).toEqual('/en/about?foo=1&test=2')
  expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja/about?foo=1&test=2')

  await page.goto(url('/ja/about?foo=bär&four=四&foo=bar'))
  await page.waitForURL(url('/ja/about?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B'))
  expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual(
    '/ja/about?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B'
  )
  expect(await page.locator('#switch-locale-path .en').innerText()).toEqual(
    '/en/about?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B'
  )

  await page.goto(url('/ja/about?foo=bär&four=四'))
  await page.waitForURL(url('/ja/about?foo=b%C3%A4r&four=%E5%9B%9B'))
  expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja/about?foo=b%C3%A4r&four=%E5%9B%9B')
  expect(await page.locator('#switch-locale-path .en').innerText()).toEqual('/en/about?foo=b%C3%A4r&four=%E5%9B%9B')

  await gotoPath(page, '/ja/about#foo=bar')
  // path hash is not sent to the server, so we need to wait for the client to hydrate
  await page.waitForFunction(() => !window.useNuxtApp?.().isHydrating)
  expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja/about#foo=bar')
  expect(await page.locator('#switch-locale-path .en').innerText()).toEqual('/en/about#foo=bar')

  await page.goto(url('/ja/about?foo=é'))
  await page.waitForURL(url('/ja/about?foo=%C3%A9'))
  expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja/about?foo=%C3%A9')

  // TODO: figure out what was being tested originally
  // await gotoPath(page, '/ja/category/1')
  // expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja/category/japanese')
  // expect(await page.locator('#switch-locale-path .en').innerText()).toEqual('/en/category/english')

  await page.goto(url('/ja/count/三'))
  await page.waitForURL(url('/ja/count/%E4%B8%89'))
  expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja/count/三')
  expect(await page.locator('#switch-locale-path .en').innerText()).toEqual('/en/count/三')

  await page.goto(url('/ja/count/三?foo=bär&four=四&foo=bar'))
  await page.waitForURL(url('/ja/count/%E4%B8%89?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B'))
  expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual(
    '/ja/count/三?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B'
  )
  expect(await page.locator('#switch-locale-path .en').innerText()).toEqual(
    '/en/count/三?foo=b%C3%A4r&foo=bar&four=%E5%9B%9B'
  )

  // TODO: figure out what was being tested originally
  // await gotoPath(page, '/ja/foo')
  // expect(await page.locator('#switch-locale-path .ja').innerText()).toEqual('/ja/not-found-japanese')
  // expect(await page.locator('#switch-locale-path .en').innerText()).toEqual('/en/not-found-english')
}

export async function localeRouteTests() {
  const { page } = await renderPage('/en')

  expect(JSON.parse(await page.locator('#locale-route .index').innerText())).include({
    fullPath: '/en',
    path: '/en',
    name: 'index___en',
    href: '/en'
  })

  expect(JSON.parse(await page.locator('#locale-route .index-name-ja').innerText())).include({
    fullPath: '/ja',
    path: '/ja',
    name: 'index___ja',
    href: '/ja'
  })

  expect(JSON.parse(await page.locator('#locale-route .about-name').innerText())).include({
    fullPath: '/en/about',
    path: '/en/about',
    name: 'about___en',
    href: '/en/about'
  })

  expect(JSON.parse(await page.locator('#locale-route .about-ja').innerText())).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: 'about___ja',
    href: '/ja/about'
  })

  expect(JSON.parse(await page.locator('#locale-route .about-name-ja').innerText())).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: 'about___ja',
    href: '/ja/about'
  })

  expect(JSON.parse(await page.locator('#locale-route .path-match-ja').innerText())).include({
    fullPath: '/ja/:pathMatch(.*)*',
    path: '/ja/:pathMatch(.*)*',
    name: 'pathMatch___ja',
    href: '/ja/:pathMatch(.*)*'
  })

  // name
  expect(JSON.parse(await page.locator('#locale-route .path-match-name').innerText())).include({
    fullPath: '/en',
    path: '/en',
    name: 'pathMatch___en',
    href: '/en'
  })

  expect(JSON.parse(await page.locator('#locale-route .path-match-name-ja').innerText())).include({
    fullPath: '/ja',
    path: '/ja',
    name: 'pathMatch___ja',
    href: '/ja'
  })

  // object
  expect(JSON.parse(await page.locator('#locale-route .about-object-ja').innerText())).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: 'about___ja',
    href: '/ja/about'
  })

  // undefined path
  expect(JSON.parse(await page.locator('#locale-route .undefined-path-ja').innerText())).include({
    fullPath: '/ja/vue-i18n',
    path: '/ja/vue-i18n',
    name: 'pathMatch___ja',
    href: '/ja/vue-i18n'
  })

  // undefined name
  expect(await page.locator('#locale-route .undefined-name-ja').innerText()).toEqual('')
}
