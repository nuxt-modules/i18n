<script setup lang="ts">
// @ts-expect-error This is because we're using Nuxt Content v2.8.2 instead of the new version which includes these types. We're using the old version because the latest has issues with highlighting
import type { NavItem } from '@nuxt/content/dist/runtime/types'

// Get navigation tree relative to the '/content/docs'
const navigation = inject<Ref<NavItem[]>>('navigation')
const { navPageFromPath } = useContentHelpers()
const allNavigationTree = computed(() =>
  mapContentNavigation(navPageFromPath('/docs', navigation.value)?.children || [])
)

// Detect if we're on the not v8 docs
const route = useRoute()
const isV7Docs = computed(() => route.path.includes('/v7'))
const isV9Docs = computed(() => route.path.includes('/v9'))

// Redirect to getting-started, if we're on the `/docs/v9`
watch(
  () => route.path,
  (newPath, _oldPath) => {
    if (newPath.endsWith('/v9')) {
      navigateTo('/docs/v9/getting-started')
    }
  }
)

// Exclude the not v8 docs from the navigation tree if we're not on the not v8 docs, and vice versa
const v7DocsNavItemIndex = computed(() => allNavigationTree.value.findIndex(el => el.to.toString().includes('/v7')))
const v9DocsNavItemIndex = computed(() => allNavigationTree.value.findIndex(el => el.to.toString().includes('/v9')))

const activeNavigationTree = computed(() =>
  allNavigationTree.value.filter((_el, index) => {
    if (isV7Docs.value) {
      return index === v7DocsNavItemIndex.value
    } else if (isV9Docs.value) {
      return index === v9DocsNavItemIndex.value
    } else {
      return index !== v7DocsNavItemIndex.value && index !== v9DocsNavItemIndex.value
    }
  })
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
