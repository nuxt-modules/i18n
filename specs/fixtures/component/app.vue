<script setup lang="ts">
import { useI18n } from '#i18n'
const { finalizePendingLocaleChange } = useI18n()

const onBeforeEnter = async () => {
  await finalizePendingLocaleChange()
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage
      :transition="{
        name: 'my',
        mode: 'out-in',
        onBeforeEnter
      }"
    />
  </NuxtLayout>
</template>

<style>
section {
  margin: 1rem 0;
}
.my-enter-active,
.my-leave-active {
  transition: opacity 0.3s;
}
.my-enter,
.my-leave-active {
  opacity: 0;
}
</style>
