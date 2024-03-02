<script setup lang="ts">
const route = useRoute()
const { locale, locales } = useI18n()
const setI18nParams = useSetI18nParams()

const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})

setI18nParams({
  en: { id: 'english' },
  ja: { id: 'japanese' }
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
