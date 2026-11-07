<script setup lang="ts">
const route = useRoute()
const widgetId = route.params.widgetId
</script>

<template>
  <div>{{ widgetId }}</div>
</template>
