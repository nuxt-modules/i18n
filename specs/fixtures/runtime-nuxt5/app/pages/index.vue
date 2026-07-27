<script setup lang="ts">
const { setLocale, t } = useI18n()
</script>

<template>
  <main id="message">
    {{ t('hello') }}
  </main>
  <button id="switch-fr" @click="setLocale('fr')">
    Français
  </button>
</template>
