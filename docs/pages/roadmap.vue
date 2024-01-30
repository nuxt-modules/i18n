<script setup>
// Page Metadata (SEO & OG)
const { setPageMeta } = usePageMeta()
setPageMeta({ title: 'Roadmap', description: 'Discover our Volta board for @nuxt/i18n development status.' })

// Volta board
const VOLTA_TOKEN =
  'eyJzdGF0dXNlcyI6WyJ0cmlhZ2UiLCJiYWNrbG9nIiwidG9kbyIsImluX3Byb2dyZXNzIiwiaW5fcmV2aWV3IiwiZG9uZSIsInJlbGVhc2VkIiwiY2FuY2VsbGVkIl0sImZpbHRlcnMiOnt9LCJvd25lciI6Im51eHQtbW9kdWxlcyIsIm5hbWUiOiJpMThuIn0='
const colorMode = useColorMode()
const appConfig = useAppConfig()

const voltaBoardSrc = computed(() => {
  const voltaBaseUrl = `https://volta.net/embed/${VOLTA_TOKEN}`
  return `${voltaBaseUrl}?theme=${colorMode.value}&primary=${appConfig.ui.primary}&gray=${appConfig.ui.gray}`
})
</script>

<template>
  <div class="h-[calc(100vh-var(--header-height)-var(--header-height)-1px)]">
    <ClientOnly>
      <iframe :src="voltaBoardSrc" width="100%" height="100%" />
    </ClientOnly>
  </div>
</template>
