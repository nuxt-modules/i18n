<script setup lang="ts">
import { useI18n, useSwitchLocalePath } from '#i18n'

const { locales, locale, setLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div>
    <template v-for="locale in locales" :key="locale">
      <section :id="`lang-switcher-with-nuxt-link-${locale}`">
        <strong>Using <code>NuxtLink</code></strong
        >:
        <NuxtLink :exact="true" :to="switchLocalePath(locale)">{{ locale }}</NuxtLink>
      </section>
      <section id="lang-switcher-with-set-locale">
        <strong>Using <code>setLocale()</code></strong
        >:
        <a :id="`set-locale-link-${locale}`" :key="`b-${locale}`" href="#" @click.prevent="setLocale(locale)">{{
          locale
        }}</a>
      </section>
    </template>
    <section id="lang-switcher-current-locale">
      <strong
        >Current Locale: <code>{{ locale }}</code></strong
      >:
    </section>
  </div>
</template>
