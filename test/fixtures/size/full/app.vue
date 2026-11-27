<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const head = useLocaleHead()

useHead(() => ({ htmlAttrs: head.value.htmlAttrs, link: head.value.link, meta: head.value.meta }))
</script>

<template>
  <div>
    <nav>
      <NuxtLinkLocale to="/">{{ $t('nav.home') }}</NuxtLinkLocale>
      <NuxtLinkLocale to="/about">{{ $t('nav.about') }}</NuxtLinkLocale>
      <NuxtLink v-for="item in locales" :key="item.code" :to="switchLocalePath(item.code)">{{ item.code }}</NuxtLink>
      <button @click="setLocale(locale === 'en' ? 'fr' : 'en')">{{ locale }}</button>
    </nav>
    <NuxtPage />
  </div>
</template>
