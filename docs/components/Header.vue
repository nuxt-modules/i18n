<script setup lang="ts">
import type { NavItem } from '@nuxt/content/dist/runtime/types'
import type { HeaderLink } from '#ui-pro/types'

defineProps<{ links: HeaderLink[] }>()

const { header } = useAppConfig()
const { metaSymbol } = useShortcuts()
const navigation = inject<NavItem[]>('navigation', [])
</script>

<template>
  <UHeader :links="links">
    <template #logo>
      <TheLogo class="w-auto h-8" />
    </template>

    <template #right>
      <UTooltip text="Search" :shortcuts="[metaSymbol, 'K']">
        <UDocsSearchButton :label="null" />
      </UTooltip>

      <UTooltip text="Toggle Theme">
        <UColorModeButton v-if="header?.colorMode" />
      </UTooltip>

      <template v-if="header?.links">
        <UButton
          v-for="(link, index) of header.links"
          :key="index"
          v-bind="{ color: 'gray', variant: 'ghost', ...link }"
        />
      </template>
    </template>

    <template #panel>
      <UNavigationTree :links="mapContentNavigation(navigation)" />
    </template>
  </UHeader>
</template>
