<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <p id="parent-text">
    {{ t('parent.text') }}
  </p>
  <NuxtPage />
</template>
