<script setup lang="ts">
import { watchEffect } from 'vue'
import { useAsyncData, useHead, useRouter } from '#imports'
import { useI18n, useLocalePath, useLocaleHead } from '#i18n'
import BasicUsage from '../components/BasicUsage.vue'
import LangSwitcher from '../components/LangSwitcher.vue'

const { t } = useI18n()
const localePath = useLocalePath()
const i18nHead = useLocaleHead({
  addLangAttribute: true,
  addDirAttribute: true,
  identifierAttribute: 'id',
  addSeoAttributes: { canonicalQueries: ['page'] },
  router: useRouter()
})
const { data, refresh } = useAsyncData('home', () =>
  Promise.resolve({
    aboutPath: localePath('about'),
    aboutTranslation: t('about')
  })
)

watchEffect(() => {
  refresh()
})

useHead(() => ({
  title: t('home'),
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs!.lang,
    dir: i18nHead.value.htmlAttrs!.dir
  },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])]
}))
</script>

<template>
  <div>
    <h1 id="home-header">{{ $t('home') }}</h1>
    <BasicUsage />
    <LangSwitcher />
    <section>
      <strong>resolve with <code>useAsyncData</code></strong
      >:
      <code id="home-use-async-data">{{ data }}</code>
    </section>
    <section>
      <strong><code>useHead</code> with <code>useLocaleHead</code></strong
      >:
      <code id="home-use-locale-head">{{ i18nHead }}</code>
    </section>
    <section>
      <code id="extend-message">{{ t('my-module-exemple.hello') }}</code>
    </section>
    <NuxtLink id="link-about" exact :to="localePath('about')">{{ $t('about') }}</NuxtLink>
    <NuxtLink id="link-blog" :to="localePath('blog')">{{ $t('blog') }}</NuxtLink>
    <NuxtLink id="link-ignore-disable" :to="localePath('/ignore-routes/disable')"
      >go to ignoring localized disable route</NuxtLink
    >
    <NuxtLink id="link-ignore-pick" :to="localePath('/ignore-routes/pick')"
      >go to ignoring localized pick route</NuxtLink
    >
    <NuxtLink id="link-category" :to="localePath('/category/test')">go to category test</NuxtLink>
    <NuxtLink id="link-products" :to="localePath({ name: 'products-id', params: { id: 'foo' } })">
      go to product foo
    </NuxtLink>
    <NuxtLink id="link-history" :to="localePath({ name: 'history' })">go to history</NuxtLink>
    <NuxtLink id="link-define-i18n-route-false" exact :to="localePath('/define-i18n-route-false')"
      >go to defineI18nRoute(false)
    </NuxtLink>
    <section>
      <span id="issue-2020-existing">{{ localePath('/test-route?foo=bar') }}</span>
      <span id="issue-2020-nonexistent">{{ localePath('/i-dont-exist?foo=bar') }}</span>
    </section>
  </div>
</template>
