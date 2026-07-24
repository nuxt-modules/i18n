<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

interface MyLinkProps {
  to?: RouteLocationRaw
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

defineProps<MyLinkProps & { label?: string }>()
</script>

<template>
  <NuxtLink :to="to">
    {{ label }}
  </NuxtLink>
</template>
