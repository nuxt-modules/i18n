<script setup lang="ts">
import { mapContentNavigation } from '@nuxt/ui-pro/runtime/utils/content.js'
import type { NuxtError } from '#app'
import type { ContentNavigationItem } from '@nuxt/content'

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

// Navigation Data
const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'))
const nav = computed<ContentNavigationItem[]>(
  () => mapContentNavigation(navigation.value).at(0).children as ContentNavigationItem[]
)
provide('navigation', nav)

const router = useRouter()
const isV7Docs = computed(() => router.currentRoute.value.path.includes('/docs/v7'))
const isV8Docs = computed(() => router.currentRoute.value.path.includes('/docs/v8'))
const isV9Docs = computed(() => !(isV8Docs.value || isV7Docs.value))
provide('isV7Docs', isV7Docs)
provide('isV8Docs', isV8Docs)
provide('isV9Docs', isV9Docs)

// // Search
const { data: files } = useAsyncData('/api/search.json', () => queryCollectionSearchSections('docs'), { server: false })

const v7DocsRE = /^\/docs\/v7/
const v8DocsRE = /^\/docs\/v8/

const navigationV7 = computed(() => nav.value.filter(x => v7DocsRE.test(String(x.path)))[0].children!)
const navigationV8 = computed(() => nav.value.filter(x => v8DocsRE.test(String(x.path)))[0].children!)

const navigationV9 = computed(() =>
  nav.value.filter(x => {
    const to = String(x.path)
    return !v8DocsRE.test(to) && !v7DocsRE.test(to)
  })
)

const currentVersionNavigation = computed(() => {
  if (isV7Docs.value) return navigationV7.value
  if (isV8Docs.value) return navigationV8.value
  return navigationV9.value
})

provide('navigationV7', navigationV7)
provide('navigationV8', navigationV8)
provide('navigationV9', navigationV9)
provide('currentVersionNavigation', currentVersionNavigation)

// // Header
const route = useRoute()
const links: unknown[] = [
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

    <UError :error="error" />

    <!-- <TheFooter /> -->

    <ClientOnly>
      <LazyUContentSearch :files="files" :navigation="currentVersionNavigation" :multiple="true" />
    </ClientOnly>
  </div>
</template>
