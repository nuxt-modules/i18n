<template>
  <div class="lang-switcher">
    <div id="default-locale">Default locale: {{ selectedLocale === defaultLocale }}</div>
    <NuxtLink id="lang-switch" :to="switchLocalePath(availableLocale)">Switch</NuxtLink>
  </div>
  <div id="content">
    <NuxtPage />
  </div>
</template>

<script setup>
const { locale: selectedLocale, defaultLocale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const availableLocale = computed(() => locales.value.find(locale => locale !== selectedLocale.value))
</script>

<style scoped>
.lang-switcher {
  margin-bottom: 30px;
}
</style>
