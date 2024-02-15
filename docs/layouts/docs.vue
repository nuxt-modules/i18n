<script setup lang="ts">
// @ts-expect-error This is because we're using Nuxt Content v2.8.2 instead of the new version which includes these types. We're using the old version because the latest has issues with highlighting
import type { NavItem } from '@nuxt/content/dist/runtime/types'

// Get navigation tree relative to the '/content/docs'
const navigation = inject<Ref<NavItem[]>>('navigation')
const { navPageFromPath } = useContentHelpers()
const allNavigationTree = computed(() =>
  mapContentNavigation(navPageFromPath('/docs', navigation.value)?.children || [])
)

// Detect if we're on the v7 docs
const route = useRoute()
const isV7Docs = computed(() => route.path.includes('/v7'))

// Exclude the v7 docs from the navigation tree if we're not on the v7 docs, and vice versa
const v7DocsNavItemIndex = computed(() => allNavigationTree.value.findIndex(el => el.to.toString().includes('/v7')))
const activeNavigationTree = computed(() =>
  allNavigationTree.value.filter((_el, index) =>
    isV7Docs.value ? index === v7DocsNavItemIndex.value : index !== v7DocsNavItemIndex.value
  )
)
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside>
          <VersionSelect />
          <UDivider type="dashed" class="mb-6" />
          <UNavigationTree :links="mapContentNavigation(activeNavigationTree)" default-open :multiple="false" />
        </UAside>
      </template>

      <slot />
    </UPage>
  </UContainer>
</template>
