<script setup lang="ts">
import { useI18n } from 'vue-i18n-bridge'
import { switchLocalePath } from 'vue-i18n-routing'

const { locale, locales, localeCodes } = useI18n()
const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})
</script>

<template>
  <div>
    <h1>Nuxt Bridge</h1>
    <h2>{{ $t('hello', { name: 'nuxt bridge' }) }}</h2>
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
