<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div>
    <h1>{{ t('sentinel') }}</h1>
    <p>{{ t('nav.greeting', { name: 'Nuxt' }) }}</p>
    <NuxtLink :to="localePath({ name: 'posts-id', params: { id: '1' } })">{{ t('nav.post') }}</NuxtLink>
  </div>
</template>
