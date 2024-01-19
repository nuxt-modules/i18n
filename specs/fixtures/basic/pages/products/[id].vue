<template>
  <div>
    <h1>This is a product page</h1>
  </div>
</template>

<script setup>
defineI18nRoute({
  paths: {
    en: '/products/[id]',
    fr: '/produits/[id]'
  }
})
</script>
