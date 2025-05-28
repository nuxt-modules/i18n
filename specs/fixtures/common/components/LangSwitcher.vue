<script setup lang="ts">
import { useI18n, useSwitchLocalePath } from '#i18n'
import { useRoute } from '#imports'

const { locales, locale, defaultLocale, setLocale } = useI18n()
const route = useRoute()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div>
    <section v-if="!$nuxt.$config.public.i18n.experimental.strictSeo" id="lang-switcher-with-nuxt-link">
      <strong>Using <code>NuxtLink</code></strong
      >:
      <NuxtLink
        v-for="(locale, index) in locales"
        :id="`nuxt-locale-link-${locale.code}`"
        :class="`switch-to-${locale.code}`"
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
        v-for="(locale, index) in locales"
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
        v-for="(locale, index) in locales"
        :id="`set-locale-link-${locale.code}`"
        :key="`b-${index}`"
        href="javascript:void(0)"
        @click.prevent="async () => await setLocale(locale.code)"
        >{{ locale.name }}</a
      >
    </section>
    <section id="lang-switcher-current-locale">
      <strong
        >Current Locale: <code>{{ locale }}</code></strong
      >:
    </section>
    <section id="lang-switcher-default-locale">
      <strong
        >Default Locale: <code>{{ defaultLocale }}</code></strong
      >:
    </section>
    <section>
      <code id="route-path">route: {{ route.path }}</code>
    </section>
  </div>
</template>
