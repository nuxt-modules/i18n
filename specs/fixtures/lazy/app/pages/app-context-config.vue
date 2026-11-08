<script setup lang="ts">
import { useI18n } from '#i18n'

const { t } = useI18n()
</script>

<template>
  <div>
    <span id="request-host">{{ t('requestHost') }}</span>
    <span id="fallback-key">{{ t('welcome') }}</span>
  </div>
</template>
