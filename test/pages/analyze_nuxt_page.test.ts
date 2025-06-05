import { test, expect } from 'vitest'
import { analyzeNuxtPages, NuxtPageAnalyzeContext } from '../../src/pages'

import type { NuxtPage } from '@nuxt/schema'

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

  const ctx = new NuxtPageAnalyzeContext({})
  analyzeNuxtPages(ctx, 'pages', pages)

  expect([...ctx.pages.values()]).toMatchInlineSnapshot(`
    [
      {
        "name": "catch",
        "path": "[...catch]",
      },
      {
        "name": undefined,
        "path": "account",
      },
      {
        "name": "account-addresses",
        "path": "account/addresses",
      },
      {
        "name": "account-fooid",
        "path": "account/foo[id]",
      },
      {
        "name": "account",
        "path": "account/index",
      },
      {
        "name": "account-profile",
        "path": "account/profile",
      },
      {
        "name": "blog-date-slug",
        "path": "blog/[date]/[slug]",
      },
      {
        "name": "foo",
        "path": "foo",
      },
      {
        "name": "foo-bar",
        "path": "foo/bar",
      },
      {
        "name": "foo-bar-buz",
        "path": "foo/bar/buz",
      },
      {
        "name": "foo-hoge-piyo",
        "path": "foo/hoge/[piyo]",
      },
      {
        "name": "foo-qux",
        "path": "foo/qux",
      },
      {
        "name": "index",
        "path": "index",
      },
      {
        "name": "users-profile",
        "path": "users/[[profile]]",
      },
    ]
  `)
})
