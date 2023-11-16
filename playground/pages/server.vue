<script setup lang="ts">
const { data } = await useFetch('/api/server')
console.log('fetch data from server-side', data)
</script>

<template>
  <div>
    <h1>fetch data from server-side</h1>
    <div>
      <code id="server-data">{{ data }}</code>
    </div>
  </div>
</template>
