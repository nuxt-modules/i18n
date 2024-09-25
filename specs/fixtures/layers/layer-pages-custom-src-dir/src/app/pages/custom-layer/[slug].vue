<script lang="ts" setup>
const { locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div>
    <h1>Hello from custom page!</h1>
    <section id="lang-switcher-with-nuxt-link">
      <strong>Using <code>NuxtLink</code></strong
      >:
      <NuxtLink
        v-for="(locale, index) in locales"
        :id="`nuxt-locale-link-${locale.code}`"
        :key="index"
        :exact="true"
        :to="switchLocalePath(locale.code)"
        >{{ locale.name }}</NuxtLink
      >
    </section>
  </div>
</template>
