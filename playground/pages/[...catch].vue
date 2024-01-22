<script setup lang="ts">
const route = useRoute()
const { locale, locales } = useI18n()

const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
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
