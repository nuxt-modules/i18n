import { mapContentNavigation } from '@nuxt/ui-pro/runtime/utils/content.js'
import type { ContentNavigationItem } from '@nuxt/content'

export default defineNuxtPlugin(async () => {
  const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'))
  const nav = computed<ContentNavigationItem[]>(
    () => mapContentNavigation(navigation.value).at(0).children as ContentNavigationItem[]
  )

  const currentDocsVersionNavigation = computed(() => {
    return nav.value
  })

  return {
    provide: {
      currentDocsVersionNavigation
    }
  }
})
