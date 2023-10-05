<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup>
defineI18nRoute({
  paths: {
    en: '/products/:id',
    fr: '/produits/:id'
  }
})
</script>
