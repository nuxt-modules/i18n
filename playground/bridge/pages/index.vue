<script setup lang="ts">
import { useI18n } from 'vue-i18n-bridge'
import { localePath, switchLocalePath, useI18nHead } from 'vue-i18n-routing'

const { t, locale, locales, getBrowserLocale } = useI18n()
const i18nHead = useI18nHead({ addSeoAttributes: true })

console.log('getBrowserLocale', getBrowserLocale())

useMeta({
  title: computed(() => t('hello', { name: 'nuxt bridge' })),
  htmlAttrs: computed(() => ({
    lang: i18nHead.value.htmlAttrs!.lang
  })),
  link: computed(() => [...(i18nHead.value.link || [])]),
  meta: computed(() => [...(i18nHead.value.meta || [])])
})

function getLocaleName(code) {
  const locale = locales.value.find(i => i.code === code)
  return locale ? locale.name : code
}

const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})
</script>

<template>
  <div>
    <h1>Demo: Nuxt Bridge</h1>
    <h2>{{ $t('hello', { name: 'nuxt bridge' }) }}</h2>
    <h2>Pages</h2>
    <nav>
      <NuxtLink :to="localePath('/')">Home</NuxtLink> |
      <NuxtLink :to="localePath('/about')">About</NuxtLink>
    </nav>
    <h2>Current Language: {{ getLocaleName(locale) }}</h2>
    <h2>Select Languages</h2>
    <nav>
      <span v-for="locale in availableLocales" :key="locale.code">
        <NuxtLink :to="switchLocalePath(locale.code) || ''">{{ locale.name }}</NuxtLink> |
      </span>
    </nav>
    <h2>I18n Head</h2>
    <div>
      <p>{{ i18nHead }}</p>
    </div>
  </div>
</template>
