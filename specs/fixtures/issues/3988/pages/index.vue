<template>
  <main>
    <h1 id="translated-heading">{{ $t('heading') }}</h1>
    <p id="translated-heading-v-text" v-text="$t('heading')" />
    <p id="translated-heading-v-html" v-html="$t('heading')" />
    <input id="translated-placeholder" :placeholder="$t('heading')">
    <p id="current-locale">{{ locale }}</p>
    <NuxtLink id="localized-home-link" :to="localePath('/')">Localized home</NuxtLink>
    <NuxtLinkLocale id="localized-home-link-locale" to="/">Localized home locale</NuxtLinkLocale>
  </main>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const { locale } = useI18n()
</script>
