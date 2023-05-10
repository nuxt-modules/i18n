<template>
  <div id="i18n-layer-target">
    {{ t('hello') }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local'
})
</script>

<i18n lang="json5">
{
  en: {
    hello: 'Hello world!'
  },
  fr: {
    hello: 'Bonjour le monde!'
  },
  nl: {
    hello: 'Hallo wereld!'
  }
}
</i18n>
