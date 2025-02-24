<script setup lang="ts">
import type { NuxtError } from '#app'

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})

defineProps<{
  error: NuxtError
}>()

useHead({
  htmlAttrs: {
    lang: 'en'
  }
})

const appConfig = useAppConfig()
const radius = computed(() => `:root { --ui-radius: ${appConfig.theme.radius}rem; }`)

useHead({
  htmlAttrs: { lang: 'en' },
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  style: [{ innerHTML: radius, id: 'nuxt-ui-radius', tagPriority: -2 }]
})

useSeoMeta({
  titleTemplate: `%s - ${appConfig.seo.siteName}`,
  ogSiteName: appConfig.seo.siteName,
  twitterCard: 'summary_large_image'
})

const { $currentDocsVersionNavigation } = useNuxtApp()

// // Search
const { data: files } = useAsyncData('/api/search.json', () => queryCollectionSearchSections('docs'), { server: false })

// // Header
const route = useRoute()
const links = computed<unknown[]>(() => [
  {
    label: 'Docs',
    to: `/docs/getting-started`,
    icon: 'i-heroicons-book-open',
    active: route.path.startsWith('/docs')
  },
  {
    label: 'Roadmap',
    to: '/roadmap',
    icon: 'i-heroicons-map'
  }
])
</script>

<template>
  <div>
    <NuxtLoadingIndicator />
    <Header :links="links" />

    <NuxtLayout>
      <UError :error="error" />
    </NuxtLayout>

    <!-- <TheFooter /> -->

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="$currentDocsVersionNavigation" :multiple="true" />
    </ClientOnly>
  </div>
</template>
