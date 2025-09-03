<script setup lang="ts">
import { mapContentNavigation } from '@nuxt/ui-pro/runtime/utils/content.js'
import type { ContentNavigationItem } from '@nuxt/content'

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

// Navigation Data
const { data: navigation } = await useAsyncData('docs_navigation', () => queryCollectionNavigation('docs'))
const nav = computed<ContentNavigationItem[]>(() => navigation.value[0].children)

// Search
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
  <UApp>
    <NuxtLoadingIndicator />
    <Header :links="links" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <Footer />

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="nav" :multiple="true" :kbds="['meta', 'K']" />
    </ClientOnly>
  </UApp>
</template>

<style></style>
