<script lang="ts" setup>
import { useI18n } from '#i18n'
import { useState } from '#imports'

const { messages, t } = useI18n()

// cached messages are handed to vue-i18n by reference and deep-frozen - writing to a nested
// message must throw, which doubles as proof that the shared (not copied) path was taken
const threw = useState('mutation-threw', () => false)
if (import.meta.server) {
  try {
    // @ts-expect-error intentional stray mutation
    messages.value.en.nested.deep = 'polluted'
  } catch {
    threw.value = true
  }
}
</script>

<template>
  <div>
    <span id="mutation-threw">{{ String(threw) }}</span>
    <span id="translated">{{ t('home') }}</span>
  </div>
</template>
