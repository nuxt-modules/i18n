<script lang="ts" setup>
import { useI18n } from '#i18n'
import { computed } from 'vue'

const { loadLocaleMessages, t } = useI18n()

await loadLocaleMessages('nl')

const welcome = computed(() => t('welcome'))
const welcomeDutch = computed(() => t('welcome', 1, { locale: 'nl' }))
</script>

<template>
  <div>
    <span id="welcome-english">{{ welcome }}</span>
    <span id="welcome-dutch">{{ welcomeDutch }}</span>
  </div>
</template>
