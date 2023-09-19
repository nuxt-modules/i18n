<template>
  <h1 id="msg">
    {{ $t('msg') }}
  </h1>
</template>

<script setup>
import { useI18n } from '#i18n'
const { locale } = useI18n()
</script>
