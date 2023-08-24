<template>
  <div>
    <Hello />
    <code id="global">{{ localeProperties }}</code>
  </div>
</template>

<script setup lang="ts">
const { localeProperties } = useI18n()
</script>
