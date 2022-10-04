<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup>
defineI18nRoute({
  paths: {
    en: '/categories/:id',
    fr: '/catégories/:id'
  }
})
</script>
