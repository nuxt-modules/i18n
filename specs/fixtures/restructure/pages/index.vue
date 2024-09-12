<script setup lang="ts">
import { watchEffect } from 'vue'
import { useAsyncData, useHead } from '#imports'
import { useI18n, useLocalePath, useLocaleHead } from '#i18n'
import LangSwitcher from '../components/LangSwitcher.vue'

const { t } = useI18n()
const localePath = useLocalePath()
const i18nHead = useLocaleHead({ addLangAttribute: true, addSeoAttributes: { canonicalQueries: ['page'] } })
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
    <p id="profile-js">{{ $t('settings.nest.foo.bar.profile') }}</p>
    <p id="profile-ts">{{ $t('settings_nest_foo_bar_profile') }}</p>
    <p id="html-message" v-html="$t('html')"></p>
    <p id="dynamic-time">{{ $t('dynamicTime') }}</p>
  </div>
</template>
