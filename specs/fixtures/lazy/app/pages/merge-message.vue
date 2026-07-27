<script lang="ts" setup>
import { useI18n } from '#i18n'
import { useRoute } from '#imports'
import { computed } from 'vue'

const { mergeLocaleMessage, messages } = useI18n()
const id = String(useRoute().query.id ?? 'none')

mergeLocaleMessage('en', { [`merged-${id}`]: `merged ${id}` })

const mergedKeys = computed(() =>
  Object.keys(messages.value.en)
    .filter(key => key.startsWith('merged-'))
    .sort()
    .join(',')
)
</script>

<template>
  <div>
    <span id="merged-keys">{{ mergedKeys }}</span>
  </div>
</template>
