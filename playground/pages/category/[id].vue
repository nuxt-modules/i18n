<script setup lang="ts">
import { LocaleObject } from '#i18n'

const route = useRoute()
const { locale, locales } = useI18n()

const availableLocales = computed(() => {
  return (locales.value as LocaleObject[]).filter(i => i.code !== locale.value)
})

definePageMeta({
  nuxtI18n: {
    en: { id: 'english' },
    ja: { id: 'japanese' }
  }
})
</script>

<template>
  <div>
    <p>This is cateory page on '{{ route.params.id }}'</p>
    <nav>
      <span v-for="locale in availableLocales" :key="locale.code">
        <NuxtLink :to="switchLocalePath(locale.code) || ''">{{ locale.name }}</NuxtLink> |
      </span>
      <i18n-t keypath="hello">
        <template #name>nuxtjs/i18n</template>
      </i18n-t>
    </nav>
  </div>
</template>
