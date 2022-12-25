<script setup lang="ts">
const appConfig = useAppConfig()
</script>

<template>
  <p id="render">{{ appConfig.myProject.name }}</p>
</template>
