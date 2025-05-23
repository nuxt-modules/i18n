<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useHead } from '#imports'
import { useI18n, useLocaleHead } from '#i18n'

const route = useRoute()
const { t } = useI18n()
useLocaleHead({ seo: { canonicalQueries: ['page', 'canonical'] } })
const title = computed(() => `Page - ${t(route.meta?.title ?? '')}`)
useHead({
  title
})
</script>

<template>
  <div>
    <slot />
  </div>
</template>
