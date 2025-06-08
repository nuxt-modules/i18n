<script lang="ts" setup>
const { locale, setLocale } = useI18n()

if (import.meta.server) {
  await setLocale('en')
}
</script>

<template>
  <div data-testid="locale">{{ locale }}</div>
  <p data-testid="welcome">{{ $t('welcome') }}</p>
</template>
