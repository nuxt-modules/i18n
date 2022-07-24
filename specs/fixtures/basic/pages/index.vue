<script setup lang="ts">
import { watchEffect } from 'vue'
import { useAsyncData, useHead } from '#app'
import { useI18n, useLocalePath, useLocaleHead } from '#i18n'
import LangSwitcher from '../components/LangSwitcher.vue'

const { t } = useI18n()
const localePath = useLocalePath()
const i18nHead = useLocaleHead({ addSeoAttributes: { canonicalQueries: ['page'] } })
const { data, refresh } = useAsyncData('home', () =>
  Promise.resolve({
    aboutPath: localePath('about'),
    aboutTranslation: t('about')
  })
)

watchEffect(() => {
  refresh()
})

useHead({
  title: t('home'),
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs!.lang
  },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])]
})
</script>

<template>
  <div>
    <h1 id="home-header">{{ $t('home') }}</h1>
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
    <NuxtLink id="link-about" exact :to="localePath('about')">{{ $t('about') }}</NuxtLink>
  </div>
</template>
