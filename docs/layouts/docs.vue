<script setup lang="ts">
// @ts-expect-error This is because we're using Nuxt Content v2.8.2 instead of the new version which includes these types. We're using the old version because the latest has issues with highlighting
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

// Show only v7 navigation content on v7 Page
// And show all navigation content except v7 navigation on other docs pages
const route = useRoute()
const { navPageFromPath } = useContentHelpers()

const isV7DocsPage = computed(() => route.path.includes('/v7'))
const mappedNavigation = computed(() =>
  mapContentNavigation(navPageFromPath('/docs', navigation.value)?.children || [])
)
const v7DocsNavItemIndex = computed(() => mappedNavigation.value.findIndex(el => el.to.toString().includes('/v7')))
const navigationTree = computed(() => {
  return mappedNavigation.value.filter((_el, index) =>
    isV7DocsPage.value ? index === v7DocsNavItemIndex.value : index !== v7DocsNavItemIndex.value
  )
})
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside>
          <VersionSelect />
          <UDivider type="dashed" class="mb-6" />
          <UNavigationTree :links="mapContentNavigation(navigationTree)" default-open :multiple="false" />
        </UAside>
      </template>

      <slot />
    </UPage>
  </UContainer>
</template>
