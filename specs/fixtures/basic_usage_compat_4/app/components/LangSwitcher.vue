<script setup lang="ts">
import { useI18n, useSwitchLocalePath } from '#i18n'
import { useRoute } from '#imports'

const { locales, locale, setLocale } = useI18n()
const route = useRoute()
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
        :id="`nuxt-locale-link-${locale.code}`"
        :key="index"
        :exact="true"
        :to="switchLocalePath(locale.code)"
        >{{ locale.name }}</NuxtLink
      >
    </section>
    <section id="lang-switcher-with-switch-locale-path-link">
      <strong>Using <code>SwitchLocalePathLink</code></strong
      >:
      <SwitchLocalePathLink
        v-for="(locale, index) in localesExcludingCurrent"
        :id="`switch-locale-path-link-${locale.code}`"
        :key="index"
        :exact="true"
        :locale="locale.code"
        >{{ locale.name }}</SwitchLocalePathLink
      >
    </section>
    <section id="lang-switcher-with-set-locale">
      <strong>Using <code>setLocale()</code></strong
      >:
      <a
        v-for="(locale, index) in localesExcludingCurrent"
        :id="`set-locale-link-${locale.code}`"
        :key="`b-${index}`"
        href="javascript:void(0)"
        @click.prevent="setLocale(locale.code)"
        >{{ locale.name }}</a
      >
    </section>
    <section id="lang-switcher-current-locale">
      <strong
        >Current Locale: <code>{{ locale }}</code></strong
      >:
    </section>
    <section>
      <code id="route-path">route: {{ route.path }}</code>
    </section>
  </div>
</template>
