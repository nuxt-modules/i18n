<script setup lang="ts">
import { localePath, useI18nHead } from 'vue-i18n-routing'

const i18nHead = useI18nHead({ addSeoAttributes: true })
useMeta({
  htmlAttrs: computed(() => ({
    lang: i18nHead.value.htmlAttrs!.lang
  })),
  link: computed(() => [...(i18nHead.value.link || [])]),
  meta: computed(() => [...(i18nHead.value.meta || [])])
})
</script>

<template>
  <div>
    <NuxtLink :to="localePath('/')">Back to Home</NuxtLink>
    <p>hello</p>
  </div>
</template>
