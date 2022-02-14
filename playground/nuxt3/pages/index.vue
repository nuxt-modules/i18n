<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { localePath, switchLocalePath, useI18nHead } from 'vue-i18n-routing'

const { t, locale, locales, localeCodes } = useI18n()

const i18nHead = useI18nHead({ addSeoAttributes: true })
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
    <h1>Nuxt 3</h1>
    <h2>{{ $t('hello', { name: 'nuxt3' }) }}</h2>
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
