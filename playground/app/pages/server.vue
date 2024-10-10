<script setup lang="ts">
const { locale } = useI18n()
const { data } = await useFetch(`/api/server?locale=${locale.value}`)
console.log('client locale', locale.value)
console.log('fetch data from server-side', data.value)
</script>

<template>
  <div>
    <h1>fetch data from server-side</h1>
    <div>
      <code id="server-data">{{ data }}</code>
    </div>
  </div>
</template>
