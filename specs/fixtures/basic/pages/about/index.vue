<script setup lang="ts">
import LangSwitcher from '../../components/LangSwitcher.vue'
import { useI18n, useLocalePath, useLocaleHead } from '#i18n'

const { localeProperties } = useI18n()
const localePath = useLocalePath()
const code = computed(() => {
  return localeProperties.value.code
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
    <h1 id="about-header">{{ $t('about') }}</h1>
    <LangSwitcher />
    <!-- div id="store-path-fr">{{ $store.state.routePathFr }}</div -->
    <section>
      <strong
        >code: <code id="locale-properties-code">{{ code }}</code></strong
      >
    </section>
    <NuxtLink id="link-home" exact :to="localePath('index')">{{ $t('home') }}</NuxtLink>
  </div>
</template>
