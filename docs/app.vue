<script setup lang="ts">
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

// Header Links
const links: PageLink[] = [
  {
    label: 'Getting Started',
    to: `/getting-started`,
    icon: 'i-heroicons-rocket-launch'
  },
  {
    label: 'Guide',
    to: '/guide',
    icon: 'i-heroicons-book-open'
  },
  {
    label: 'Options',
    to: '/options',
    icon: 'i-heroicons-adjustments-horizontal'
  },
  {
    label: 'API',
    to: '/api',
    icon: 'i-heroicons-code-bracket'
  },

  {
    label: 'Roadmap',
    to: '/roadmap',
    icon: 'i-heroicons-map'
  },

  {
    label: 'v7 Docs',
    to: '/v7',
    icon: 'i-heroicons-backward'
  }
]
</script>

<template>
  <div>
    <Header :links="links" />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <Footer />

    <ClientOnly>
      <LazyUDocsSearch :files="files" :navigation="navigation" :links="links" />
    </ClientOnly>

    <UNotifications />
  </div>
</template>
