<template>
  This is about page.
  <NuxtLink id="goto-index" :to="localePath({ name: 'index' })">To home page</NuxtLink>
</template>

<script setup>
const localePath = useLocalePath()
</script>
