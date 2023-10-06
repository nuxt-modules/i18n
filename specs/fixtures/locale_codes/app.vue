<script setup lang="ts">
import { useI18n } from '#i18n'
const { locales } = useI18n()
</script>

<template>
  <ul>
    <li v-for="locale in locales" :key="locale.code">
      {{ locale.code }}
    </li>
  </ul>
</template>
