import { mapContentNavigation } from '@nuxt/ui-pro/runtime/utils/content.js'
import type { ContentNavigationItem } from '@nuxt/content'

const v7DocsRE = /^\/docs\/v7/
const v8DocsRE = /^\/docs\/v8/

export default defineNuxtPlugin(async () => {
  const router = useRouter()

  if (import.meta.server) {
    const req = useRequestURL()
    if (req.hostname.startsWith('v8') && req.pathname === '/') {
      navigateTo('/docs/v8/getting-started')
    }

    if (req.hostname.startsWith('v7') && req.pathname === '/') {
      navigateTo('/docs/v7/setup')
    }
  }

  const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'))
  const nav = computed<ContentNavigationItem[]>(
    () => mapContentNavigation(navigation.value).at(0).children as ContentNavigationItem[]
  )

  const isV7Docs = computed(() => router.currentRoute.value.path.includes('/docs/v7'))
  const isV8Docs = computed(() => router.currentRoute.value.path.includes('/docs/v8'))

  const navigationV7 = computed(() => nav.value.filter(x => v7DocsRE.test(String(x.path)))[0].children!)
  const navigationV8 = computed(() => nav.value.filter(x => v8DocsRE.test(String(x.path)))[0].children!)
  const navigationV9 = computed(() =>
    nav.value.filter(x => {
      const to = String(x.path)
      return !v8DocsRE.test(to) && !v7DocsRE.test(to)
    })
  )

  const currentDocsVersion = computed(() => {
    if (isV7Docs.value) return 7
    if (isV8Docs.value) return 8
    return 9
  })

  const currentDocsVersionNavigation = computed(() => {
    if (currentDocsVersion.value === 7) return navigationV7.value
    if (currentDocsVersion.value === 8) return navigationV8.value
    return navigationV9.value
  })

  return {
    provide: {
      currentDocsVersion,
      currentDocsVersionNavigation
    }
  }
})
