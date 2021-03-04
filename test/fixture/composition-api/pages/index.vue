<template>
  <div>
    <div id="current-locale">locale: {{ $i18n.locale }}</div>
    <div id="content">{{ someText }}</div>
  </div>
</template>

<script>
import { defineComponent, useContext } from '@nuxtjs/composition-api'
export default defineComponent({
  setup () {
    const { app: { i18n } } = useContext()
    const someText = i18n.t('untranslated')
    return { someText }
  }
})
</script>
