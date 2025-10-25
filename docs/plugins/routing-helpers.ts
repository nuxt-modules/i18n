import type { ContentNavigationItem } from '@nuxt/content'

export default defineNuxtPlugin(async () => {
  const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'))
  const currentDocsVersionNavigation = computed(() => navigation.value.at(0).children as ContentNavigationItem[])

  return {
    provide: {
      currentDocsVersionNavigation
    }
  }
})
