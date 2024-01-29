<script setup>
const title = 'Roadmap'
const description = 'Discover our Volta board for @nuxt/ui development status.'

useSeoMeta({
  titleTemplate: '%s - Nuxt i18n',
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImage({
  component: 'Docs',
  title,
  description
})

const appConfig = useAppConfig()
const colorMode = useColorMode()

const token =
  'eyJzdGF0dXNlcyI6WyJ0cmlhZ2UiLCJiYWNrbG9nIiwidG9kbyIsImluX3Byb2dyZXNzIiwiaW5fcmV2aWV3IiwiZG9uZSIsInJlbGVhc2VkIiwiY2FuY2VsbGVkIl0sImZpbHRlcnMiOnt9LCJvd25lciI6Im51eHQtbW9kdWxlcyIsIm5hbWUiOiJpMThuIn0='

const src = computed(
  () =>
    `https://volta.net/embed/${token}?theme=${colorMode.value}&gray=${appConfig.ui.gray}&primary=${appConfig.ui.primary}`
)
</script>

<template>
  <div class="h-[calc(100vh-var(--header-height)-var(--header-height)-1px)]">
    <ClientOnly>
      <iframe :src="src" width="100%" height="100%" />
    </ClientOnly>
  </div>
</template>
