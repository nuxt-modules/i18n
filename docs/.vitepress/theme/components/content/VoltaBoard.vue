<template>
  <iframe :src="src" style="width: 100%; min-height: calc(100vh / 1.5)" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps({
  token: {
    type: String,
    required: true
  }
})
const src = computed(() => `https://volta.net/embed/${props.token}`)
</script>
