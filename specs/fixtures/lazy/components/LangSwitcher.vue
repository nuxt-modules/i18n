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
    <section id="lang-switcher-with-nuxt-link">
      <strong>Using <code>NuxtLink</code></strong
      >:
      <NuxtLink
        v-for="(locale, index) in localesExcludingCurrent"
        :key="index"
        :id="`lang-switcher-with-nuxt-link-${locale.code}`"
        :exact="true"
        :to="switchLocalePath(locale.code)"
        >{{ locale.name }}</NuxtLink
      >
    </section>
    <section id="lang-switcher-with-set-locale">
      <strong>Using <code>setLocale()</code></strong
      >:
      <a
        v-for="(locale, index) in localesExcludingCurrent"
        :id="`set-locale-link-${locale.code}`"
        :key="`b-${index}`"
        href="#"
        @click.prevent="setLocale(locale.code)"
        >{{ locale.name }}</a
      >
    </section>
    <section id="lang-switcher-current-locale">
      <strong
        >Current Locale: <code>{{ locale }}</code></strong
      >:
    </section>
  </div>
</template>
