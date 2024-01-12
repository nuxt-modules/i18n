import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

import { STRATEGIES } from '../../src/constants'
import { setup, url } from '../utils'
import { getText, gotoPath, renderPage, waitForURL } from '../helper'

await setup({
  rootDir: fileURLToPath(new URL(`../fixtures/routing`, import.meta.url)),
  browser: true,
  // overrides
  nuxtConfig: {
    i18n: {
      strategy: STRATEGIES.PREFIX_EXCEPT_DEFAULT,
      customRoutes: 'config',
      pages: {
        // 'categories/[id]': {
        //   en: 'categories/english',
        //   ja: 'categories/japanese'
        // }
        // '[...pathMatch]': {
        //   en: { pathMatch: 'not-found-english' },
        //   ja: { pathMatch: 'not-found-japanese' }
        // }
      }
    }
  }
})
describe('localeRoute', async () => {
  it('should work', async () => {
    const { page } = await renderPage('/en')

    expect(JSON.parse(await getText(page, '#locale-route .index'))).include({
      fullPath: '/en',
      path: '/en',
      // name: 'not-found___en',
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
    // expect(JSON.parse(await getText(page, '#locale-route .path-match-ja'))).include({
    //   fullPath: '/ja/:pathMatch(.*)*',
    //   path: '/ja/:pathMatch(.*)*',
    //   name: 'not-found___ja',
    //   href: '/ja/:pathMatch(.*)*'
    // })
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
    // no define path
    // expect(JSON.parse(await getText(page, '#locale-route .undefined-ja'))).include({
    //   fullPath: '/ja/vue-i18n',
    //   path: '/ja/vue-i18n',
    //   name: 'not-found___ja',
    //   href: '/ja/vue-i18n'
    // })
    // no define name
    // assert.isUndefined(vm.localeRoute('vue-i18n'))
    // }
  })
})

describe('localeLocation', async () => {
  it('should work', async () => {
    const { page } = await renderPage('/en')

    expect(JSON.parse(await getText(page, '#locale-location .index'))).include({
      fullPath: '/en',
      path: '/en',
      // name: 'not-found___en',
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
    // expect(JSON.parse(await getText(page, '#locale-location .path-match-ja'))).include({
    //   fullPath: '/ja/:pathMatch(.*)*',
    //   path: '/ja/:pathMatch(.*)*',
    //   name: 'not-found___ja',
    //   href: '/ja/:pathMatch(.*)*'
    // })
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
    // no define path
    // expect(JSON.parse(await getText(page, '#locale-location .undefined-ja'))).include({
    //   fullPath: '/ja/vue-i18n',
    //   path: '/ja/vue-i18n',
    //   name: 'not-found___ja',
    //   href: '/ja/vue-i18n'
    // })
    // no define name
    // assert.isUndefined(vm.localeLocation('vue-i18n'))
    // }
  })
})

describe('switchLocalePath', async () => {
  it('should work', async () => {
    const { page } = await renderPage('/en')

    expect(await getText(page, '#switch-locale-path .en')).toEqual('/en')
    expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja')
    // assert.equal(vm.switchLocalePath('vue-i18n'), '')

    // await gotoPath(page, '/ja/about')
    await gotoPath(page, '/ja/about')

    expect(await getText(page, '#switch-locale-path .en')).toEqual('/en/about')
    expect(await getText(page, '#switch-locale-path .ja')).toEqual('/ja/about')
    // assert.equal(vm.switchLocalePath('vue-i18n'), '')

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
  })
})
