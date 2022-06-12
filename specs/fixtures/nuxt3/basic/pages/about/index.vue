<script setup lang="ts">
import LangSwitcher from '../../components/LangSwitcher.vue'
import { useI18n, useLocalePath, useLocaleHead } from '#i18n'

const { locale, localeProperties } = useI18n()
const localePath = useLocalePath()
const i18nHead = useLocaleHead({ addSeoAttributes: { canonicalQueries: ['page'] } })
const code = computed(() => {
  return localeProperties.value.code
})

watch(localeProperties, val => {
  console.log('watch localeProperties', val)
})

console.log('localeProperties', localeProperties)
console.log('i18nHead', i18nHead)
console.log('code', code)

useHead({
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs!.lang
  },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])]
})

/*
// TODO: defineNuxtI18n macro
defineNuxtI18n({
  paths: {
    en: '/about-us',
    fr: '/a-propos'
  }
})
*/
</script>

<template>
  <div>
    <LangSwitcher />
    <div id="current-page">page: {{ $t('about') }}</div>
    <NuxtLink id="link-home" exact :to="localePath('index')">{{ $t('home') }}</NuxtLink>
    <!-- div id="store-path-fr">{{ $store.state.routePathFr }}</div -->
    <div id="locale-properties-code">code: {{ code }}</div>
    <div>
      <p id="locale-on-about">locale: {{ locale }}</p>
    </div>
    <div>
      <p id="locale-head-on-about">{{ i18nHead }}</p>
    </div>
  </div>
</template>
