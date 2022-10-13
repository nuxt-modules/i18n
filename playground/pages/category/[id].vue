<script setup lang="ts">
import { computed } from 'vue'
import { LocaleObject, useI18n } from '#i18n'

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
    </nav>
  </div>
</template>
