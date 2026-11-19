<script setup lang="ts">
const hasContext = useRequestEvent()?.context.nuxtI18n != null
</script>

<template>
  <span id="server-context">{{ hasContext }}</span>
</template>
