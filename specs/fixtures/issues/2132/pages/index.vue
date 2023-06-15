<template>
  <h1 id="msg">
    {{ $t('msg') }}
  </h1>
</template>

<script setup>
const { locale } = useI18n();
</script>
