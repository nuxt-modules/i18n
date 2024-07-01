<script setup lang="ts">
import { useI18n } from '#i18n'
import { useRuntimeConfig } from '#imports'

const { finalizePendingLocaleChange } = useI18n()

const skipSettingLocale = useRuntimeConfig().public.i18n.skipSettingLocaleOnNavigate
const pageTransition = {
  name: 'my',
  mode: 'out-in',
  onBeforeEnter: async () => {
    await finalizePendingLocaleChange()
  }
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage id="nuxt-page" :transition="skipSettingLocale ? pageTransition : undefined" />
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
