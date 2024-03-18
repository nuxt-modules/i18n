<script setup lang="ts">
import LangSwitcher from '../components/LangSwitcher.vue'
import { useI18n } from '#i18n'

const { t } = useI18n({
  inheritLocale: true,
  useScope: 'local'
})
</script>

<template>
  <div>
    <LangSwitcher />
    <h3 id="per-component-hello">{{ t('hello') }}</h3>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "hello": "Hello!"
  },
  "fr": {
    "hello": "Bonjour!"
  }
}
</i18n>
