<template>
  <div id="app">
    {{ env }}
    {{ data }}
    <div v-if="correct && env == 'DEV'">working in dev as intended</div>
    <div v-if="!correct && env == 'DEV'">wtf now it's not working even in dev?</div>

    <div v-if="!correct && env == 'PROD'">unfortunately still doesn't work in prod</div>
    <div v-if="correct && env == 'PROD'">yeah! it's finally working in prod too</div>
  </div>
</template>

<script setup lang="ts">
const data = ref([])
const env = process.dev ? 'DEV' : 'PROD'
const correct = computed(() => ['Test', 'Тест'].includes(data.value[0]))

data.value = await $fetch('/api/foo')
</script>
