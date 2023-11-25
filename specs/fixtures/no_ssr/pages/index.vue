<template>
  <div>
    <div id="top">Foo</div>
    Locale: <code id="locale">{{ locale }}</code>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()
</script>
