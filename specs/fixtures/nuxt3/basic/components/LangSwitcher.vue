<script setup lang="ts">
import { useI18n, useSwitchLocalePath } from '#i18n'

const { locales, locale, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const localesExcludingCurrent = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})
</script>

<template>
  <div>
    <strong>Using nuxt-link</strong>:
    <div id="lang-switcher">
      <NuxtLink
        v-for="(locale, index) in localesExcludingCurrent"
        :key="index"
        :exact="true"
        :to="switchLocalePath(locale.code)"
        >{{ locale.name }}</NuxtLink
      >
    </div>
    <strong>Using setLocale()</strong>:
    <div>
      <a
        v-for="(locale, index) in localesExcludingCurrent"
        :id="`set-locale-link-${locale.code}`"
        :key="`b-${index}`"
        href="#"
        @click.prevent="setLocale(locale.code)"
        >{{ locale.name }}</a
      >
    </div>
  </div>
</template>
