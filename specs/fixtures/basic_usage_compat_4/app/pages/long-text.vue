<script setup lang="ts">
import { useI18n } from '#imports'

const { t } = useI18n()
</script>

<template>
  <div>
    <p id="long-text">{{ t('big') }}</p>
  </div>
</template>
