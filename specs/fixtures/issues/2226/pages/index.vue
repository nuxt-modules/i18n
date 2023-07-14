<template>
  This is home page.
  <NuxtLink id="goto-about" :to="localePath({ name: 'about' })">To about page</NuxtLink>
</template>

<script setup>
const localePath = useLocalePath()
</script>
