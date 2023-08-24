<template>
  <code id="local">{{ localeProperties }}</code>
</template>

<script setup lang="ts">
const { localeProperties } = useI18n({
  useScope: 'local'
})
</script>
