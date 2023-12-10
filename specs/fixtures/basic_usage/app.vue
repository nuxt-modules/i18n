<script setup lang="ts">
import { useLocaleHead } from 'vue-i18n-routing'

const head = useLocaleHead({ addSeoAttributes: true })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
