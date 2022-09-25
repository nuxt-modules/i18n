<script setup lang="ts">
import { computed } from 'vue'

// import { useLocalePath, useSwitchLocalePath, useLocaleHead, useBrowserLocale } from '#i18n'
import { LocaleObject, useI18n } from '#i18n'

const { t, strategy, locale, locales, localeProperties, setLocale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

definePageMeta({
  title: 'pages.title.top'
})

console.log('useBrowserLocale', useBrowserLocale())
console.log('localeProperties', localeProperties)

function getLocaleName(code: string) {
  const locale = (locales.value as LocaleObject[]).find(i => i.code === code)
  return locale ? locale.name : code
}

const availableLocales = computed(() => {
  return (locales.value as LocaleObject[]).filter(i => i.code !== locale.value)
})
</script>

<template>
  <div>
    <h1>Demo: Nuxt 3</h1>
    <h2>{{ $t('hello', { name: 'nuxt3' }) }}</h2>
    <h2>Pages</h2>
    <nav>
      <NuxtLink :to="localePath('/')">Home</NuxtLink> |
      <NuxtLink :to="localePath('/about')">About</NuxtLink>
    </nav>
    <h2>Current Language: {{ getLocaleName(locale) }}</h2>
    <h2>Current Strategy: {{ strategy }}</h2>
    <h2>Select Languages with switchLocalePath</h2>
    <nav>
      <span v-for="locale in availableLocales" :key="locale.code">
        <NuxtLink :to="switchLocalePath(locale.code) || ''">{{ locale.name }}</NuxtLink> |
      </span>
    </nav>
    <h2>Select Languages with setLocale</h2>
    <nav>
      <span v-for="locale in availableLocales" :key="locale.code">
        <a href="javascript:void(0)" @click="setLocale(locale.code)">{{ locale.name }}</a> |
      </span>
    </nav>
  </div>
</template>
