/// <reference types="vitest/globals" />

import { gotoPath, renderPage } from '../helper'
import { url } from '../utils'

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

  // Detect compact routes: compact routes use the base name (no ___locale suffix)
  const indexRoute = JSON.parse(await page.locator('#locale-route .index').innerText())
  const compacted = !indexRoute.name.includes('___')
  const routeName = (base: string, locale: string) => (compacted ? base : `${base}___${locale}`)

  expect(indexRoute).include({
    fullPath: '/en',
    path: '/en',
    name: routeName('index', 'en'),
    href: '/en'
  })

  expect(JSON.parse(await page.locator('#locale-route .index-name-ja').innerText())).include({
    fullPath: '/ja',
    path: '/ja',
    name: routeName('index', 'ja'),
    href: '/ja'
  })

  expect(JSON.parse(await page.locator('#locale-route .about-name').innerText())).include({
    fullPath: '/en/about',
    path: '/en/about',
    name: routeName('about', 'en'),
    href: '/en/about'
  })

  expect(JSON.parse(await page.locator('#locale-route .about-ja').innerText())).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: routeName('about', 'ja'),
    href: '/ja/about'
  })

  expect(JSON.parse(await page.locator('#locale-route .about-name-ja').innerText())).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: routeName('about', 'ja'),
    href: '/ja/about'
  })

  expect(JSON.parse(await page.locator('#locale-route .path-match-ja').innerText())).include({
    fullPath: '/ja/:pathMatch(.*)*',
    path: '/ja/:pathMatch(.*)*',
    name: routeName('pathMatch', 'ja'),
    href: '/ja/:pathMatch(.*)*'
  })

  // name
  expect(JSON.parse(await page.locator('#locale-route .path-match-name').innerText())).include({
    fullPath: '/en',
    path: '/en',
    name: routeName('pathMatch', 'en'),
    href: '/en'
  })

  expect(JSON.parse(await page.locator('#locale-route .path-match-name-ja').innerText())).include({
    fullPath: '/ja',
    path: '/ja',
    name: routeName('pathMatch', 'ja'),
    href: '/ja'
  })

  // object
  expect(JSON.parse(await page.locator('#locale-route .about-object-ja').innerText())).include({
    fullPath: '/ja/about',
    path: '/ja/about',
    name: routeName('about', 'ja'),
    href: '/ja/about'
  })

  // undefined path
  expect(JSON.parse(await page.locator('#locale-route .undefined-path-ja').innerText())).include({
    fullPath: '/ja/vue-i18n',
    path: '/ja/vue-i18n',
    name: routeName('pathMatch', 'ja'),
    href: '/ja/vue-i18n'
  })

  // undefined name
  expect(await page.locator('#locale-route .undefined-name-ja').innerText()).toEqual('')
}
