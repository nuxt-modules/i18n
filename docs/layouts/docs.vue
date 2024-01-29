<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'

const navigation = inject<Ref<NavItem[]>>('navigation')

// Show only v7 navigation content on v7 Page
// And show all navigation content except v7 navigation on other docs pages
const route = useRoute()
const isV7DocsPage = computed(() => route.path.includes('/v7'))
const v7DocsNavItemIndex = computed(() => navigation.value.findIndex(el => el._path.includes('/v7')))
const navigationTree = computed(() => {
  return navigation.value.filter((_el, index) =>
    isV7DocsPage.value ? index === v7DocsNavItemIndex.value : index !== v7DocsNavItemIndex.value
  )
})
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside>
          <UNavigationTree :links="mapContentNavigation(navigationTree)" />
        </UAside>
      </template>

      <slot />
    </UPage>
  </UContainer>
</template>
