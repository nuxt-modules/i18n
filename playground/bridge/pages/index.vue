<script setup lang="ts">
import { useI18n } from 'vue-i18n-bridge'
import { localePath, switchLocalePath, useI18nHead } from 'vue-i18n-routing'

const { t, locale, locales, localeCodes } = useI18n()
const i18nHead = useI18nHead({ addSeoAttributes: true })
console.log('i18nHead htmlAttrs', JSON.stringify(i18nHead.value.htmlAttrs))
console.log('i18nHead link', i18nHead.value.link)
console.log('i18nHead meta', i18nHead.value.meta)

useMeta({
  title: computed(() => t('hello', { name: 'nuxt bridge' })),
  htmlAttrs: computed(() => ({
    lang: i18nHead.value.htmlAttrs!.lang
  })),
  link: computed(() => [...(i18nHead.value.link || [])]),
  meta: computed(() => [...(i18nHead.value.meta || [])])
})
const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})
</script>

<template>
  <div>
    <h1>Nuxt Bridge</h1>
    <h2>{{ $t('hello', { name: 'nuxt bridge' }) }}</h2>
    <nav>
      <NuxtLink :to="localePath('/')">Home</NuxtLink>
      <NuxtLink :to="localePath('/about')">About</NuxtLink>
    </nav>
    <form>
      <select id="locale-select" v-model="locale">
        <template v-for="code in localeCodes">
          <option :value="code">{{ code }}</option>
        </template>
      </select>
    </form>
    <span v-for="locale in availableLocales" :key="locale.code">
      <NuxtLink :to="switchLocalePath(locale.code) || ''">{{ locale.name }}</NuxtLink> |
    </span>
  </div>
</template>
