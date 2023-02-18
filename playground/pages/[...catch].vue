<script setup lang="ts">
import { LocaleObject } from '#i18n'

const route = useRoute()
const { locale, locales } = useI18n()

const availableLocales = computed(() => {
  return (locales.value as LocaleObject[]).filter(i => i.code !== locale.value)
})

definePageMeta({
  nuxtI18n: {
    en: { catch: ['not-found-english'] },
    ja: { catch: ['not-found-japanese'] }
  }
})
</script>

<template>
  <div>
    <p>This page is catch all: '{{ route.params }}'</p>
    <nav>
      <span v-for="locale in availableLocales" :key="locale.code">
        <NuxtLink :to="switchLocalePath(locale.code) || ''">{{ locale.name }}</NuxtLink> |
      </span>
    </nav>
  </div>
</template>
