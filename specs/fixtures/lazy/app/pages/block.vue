<script setup lang="ts">
import { useI18n } from '#i18n'

const { t } = useI18n({ useScope: 'local' })
</script>

<template>
  <h1 id="block-message">{{ t('blockMessage') }}</h1>
</template>

<i18n lang="json">
{
  "en": { "blockMessage": "Block message" },
  "fr": { "blockMessage": "Message de bloc" }
}
</i18n>
