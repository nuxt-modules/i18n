<script setup lang="ts">
const route = useRoute()
const setI18nParams = useSetI18nParams()

setI18nParams({ en: { id: route.params.id }, fr: { id: route.params.id }, ja: { id: route.params.id } })
</script>

<template>
  <div>{{ $t('nav.post') }} {{ route.params.id }}</div>
</template>
