<template>
  <div>
    {{ $t('welcome') }}
  </div>
</template>

<script setup lang="ts">
const _i18n = useI18n()

const head = useLocaleHead()

useHead(() => ({
  htmlAttrs: head.value.htmlAttrs
}))
</script>
