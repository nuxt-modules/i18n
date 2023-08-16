<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  i18n: {
    locale: 'en',
    messages: {
      en: {
        hello: 'Hello, local!'
      }
    }
  }
})
</script>

<template>
  <p>
    Legacy: <code id="msg">{{ $t('hello') }}</code>
  </p>
</template>
