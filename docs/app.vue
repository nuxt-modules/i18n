<script setup lang="ts">
// @ts-expect-error This is because we're using Nuxt Content v2.8.2 instead of the new version which includes these types. We're using the old version because the latest has issues with highlighting
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'
import type { PageLink } from '#ui-pro/types'

// Seo
const { seo } = useAppConfig()
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en' }
})
useSeoMeta({ ogSiteName: seo?.siteName, twitterCard: 'summary_large_image' })

// Navigation Data
const { data: navigation } = await useAsyncData('navigation', () => fetchContentNavigation())
provide('navigation', navigation)

// Search
const { data: files } = useLazyFetch<ParsedContent[]>('/api/search.json', {
  default: () => [],
  server: false
})

// Header
const route = useRoute()
const links: PageLink[] = [
  {
    label: 'Docs',
    to: `/docs/getting-started`,
    icon: 'i-heroicons-rocket-launch',
    active: route.path.startsWith('/docs')
  },
  {
    label: 'Roadmap',
    to: '/roadmap',
    icon: 'i-heroicons-map'
  }
]
</script>

<template>
  <div>
    <Header :links="links" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <Footer />

    <ClientOnly>
      <LazyUDocsSearch :files="files" :navigation="navigation" :links="links" />
    </ClientOnly>

    <UNotifications />
  </div>
</template>
