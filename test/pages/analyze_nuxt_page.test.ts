import { test, expect } from 'vitest'
import { analyzeNuxtPages } from '../../src/pages'

import type { NuxtPage } from '@nuxt/schema'
import type { NuxtPageAnalyzeContext, AnalyzedNuxtPageMeta } from '../../src/pages'

test('analyzeNuxtPages', () => {
  const pages: NuxtPage[] = [
    {
      name: 'catch',
      path: '/:catch(.*)*',
      file: '/path/to/nuxt-app/pages/[...catch].vue',
      children: []
    },
    {
      path: '/account',
      file: '/path/to/nuxt-app/pages/account.vue',
      children: [
        {
          name: 'account-addresses',
          path: 'addresses',
          file: '/path/to/nuxt-app/pages/account/addresses.vue',
          children: []
        },
        {
          name: 'account-fooid',
          path: 'foo:id',
          file: '/path/to/nuxt-app/pages/account/foo[id].vue',
          children: []
        },
        {
          name: 'account',
          path: '',
          file: '/path/to/nuxt-app/pages/account/index.vue',
          children: []
        },
        {
          name: 'account-profile',
          path: 'profile',
          file: '/path/to/nuxt-app/pages/account/profile.vue',
          children: []
        }
      ]
    },
    {
      name: 'blog-date-slug',
      path: '/blog/:date/:slug',
      file: '/path/to/nuxt-app/pages/blog/[date]/[slug].vue',
      children: []
    },
    {
      name: 'foo',
      path: '/foo',
      file: '/path/to/nuxt-app/pages/foo.vue',
      children: [
        {
          name: 'foo-bar',
          path: 'bar',
          file: '/path/to/nuxt-app/pages/foo/bar.vue',
          children: [
            {
              name: 'foo-bar',
              path: 'bar',
              file: '/path/to/nuxt-app/pages/foo/bar.vue',
              children: [
                {
                  name: 'foo-bar-buz',
                  path: 'buz',
                  file: '/path/to/nuxt-app/pages/foo/bar/buz.vue',
                  children: []
                }
              ]
            }
          ]
        },
        {
          name: 'foo-hoge-piyo',
          path: 'hoge/:piyo',
          file: '/path/to/nuxt-app/pages/foo/hoge/[piyo].vue',
          children: []
        },
        {
          name: 'foo-qux',
          path: 'qux',
          file: '/path/to/nuxt-app/pages/foo/qux.vue',
          children: []
        }
      ]
    },
    {
      name: 'index',
      path: '/',
      file: '/path/to/nuxt-app/pages/index.vue',
      children: []
    },
    {
      name: 'users-profile',
      path: '/uses/:profile?',
      file: '/path/to/nuxt-app/pages/users/[[profile]].vue',
      children: []
    }
  ]

  const srcDir = '/path/to/nuxt-app'
  const pagesDir = 'pages'
  const ctx: NuxtPageAnalyzeContext = {
    stack: [],
    srcDir,
    pagesDir,
    pages: new Map<NuxtPage, AnalyzedNuxtPageMeta>()
  }
  analyzeNuxtPages(ctx, pages)

  expect(ctx.stack.length).toBe(0)
  expect([...ctx.pages.values()]).toEqual([
    { inRoot: true, path: '[...catch]' },
    { inRoot: true, path: 'account' },
    { inRoot: false, path: 'account/addresses' },
    { inRoot: false, path: 'account/foo[id]' },
    { inRoot: false, path: 'account/index' },
    { inRoot: false, path: 'account/profile' },
    { inRoot: true, path: 'blog/[date]/[slug]' },
    { inRoot: true, path: 'foo' },
    { inRoot: false, path: 'foo/bar' },
    { inRoot: false, path: 'foo/bar' },
    { inRoot: false, path: 'foo/bar/buz' },
    { inRoot: false, path: 'foo/hoge/[piyo]' },
    { inRoot: false, path: 'foo/qux' },
    { inRoot: true, path: 'index' },
    { inRoot: true, path: 'users/[[profile]]' }
  ])
})
