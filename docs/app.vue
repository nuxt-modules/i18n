<script setup lang="ts">
// @ts-expect-error This is because we're using Nuxt Content v2.8.2 instead of the new version which includes these types. We're using the old version because the latest has issues with highlighting
import type { ParsedContent } from '@nuxt/content/dist/runtime/types'
import type { PageLink } from '#ui-pro/types'

// Seo
const { seo } = useAppConfig()
useHead({ htmlAttrs: { lang: 'en' }, link: [{ rel: 'icon', href: '/favicon.ico' }] })
useSeoMeta({
  titleTemplate: `%s - ${seo.siteName}`,
  ogSiteName: seo.siteName,
  twitterCard: 'summary_large_image'
})

// Navigation Data
const { data: navigation } = await useAsyncData('navigation', () => fetchContentNavigation())
provide('navigation', navigation)

const router = useRouter()

const isV7Docs = computed(() => router.currentRoute.value.path.includes('/docs/v7'))
const isV9Docs = computed(() => router.currentRoute.value.path.includes('/docs/v9'))

// Search
const { data: files } = useLazyFetch<ParsedContent[]>('/api/search.json', {
  default: () => [],
  server: false
})

const v7DocsRE = /^\/docs\/v7/
const v9DocsRE = /^\/docs\/v9/

const navigationV7 = computed(() => navigation.value?.[0].children.filter(x => v7DocsRE.test(String(x._path))))
const navigationV9 = computed(() => navigation.value?.[0].children.filter(x => v9DocsRE.test(String(x._path))))
const navigationV8 = computed(() =>
  navigation.value?.[0].children.filter(x => {
    const to = String(x._path)
    return !v9DocsRE.test(to) && !v7DocsRE.test(to)
  })
)

const currentVersionNavigation = computed(() => {
  if (isV7Docs.value) return navigationV7.value
  if (isV9Docs.value) return navigationV9.value
  return navigationV8.value
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
    <TheHeader :links="links" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <TheFooter />

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="currentVersionNavigation" :links="links" />
    </ClientOnly>

    <UNotifications />
  </div>
</template>

<style>
body {
  font-family: 'Inter var experimental', 'Inter var', 'Inter', sans-serif;
}
</style>
