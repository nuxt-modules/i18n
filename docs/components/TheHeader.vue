<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '#ui/types'
import type { ContentNavigationItem } from '@nuxt/content'

const props = defineProps<{ links?: NavigationMenuItem[] }>()

const { header } = useAppConfig()
const config = useRuntimeConfig()
const navigation = inject<Ref<ContentNavigationItem[]>>('currentVersionNavigation')
const route = useRoute()

function versionActive(version: number) {
  if (version === 9) return route.fullPath.search(/docs\/v7|8/) === -1
  if (version === 8) return route.fullPath.search(/docs\/v8/) >= 0
  return route.fullPath.search(/docs\/v7/) >= 0
}

const items = computed(() => props.links.map(({ icon, ...link }) => link))
const processed = computed<DropdownMenuItem[]>(() => {
  const items = [
    { label: `v${config.public.version}`, version: 9, to: '/docs' },
    { label: 'v8.x', version: 8, to: '/docs/v8' },
    { label: 'v7.x', version: 7, to: '/docs/v7' }
  ]

  return items.map(x => ({
    ...x,
    color: (versionActive(x.version) && 'primary') || undefined,
    active: versionActive(x.version),
    checked: versionActive(x.version),
    type: (versionActive(x.version) && 'checkbox') || undefined
  }))
})
</script>

<template>
  <UHeader :menu="{ shouldScaleBackground: true }">
    <template #left>
      <NuxtLink
        to="/"
        class="flex items-end gap-2 font-bold text-xl text-(--ui-text-highlighted) min-w-0 focus-visible:outline-(--ui-primary) shrink-0"
      >
        <TheLogo class="w-auto h-8 shrink-0" />
      </NuxtLink>
      <UDropdownMenu
        v-slot="{ open }"
        :modal="false"
        :items="processed"
        :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-0' }"
        size="xs"
      >
        <UButton
          :label="versionActive(9) ? `v${config.public.version}` : versionActive(8) ? `v8.x` : `v7.x`"
          variant="subtle"
          trailing-icon="i-lucide-chevron-down"
          size="xs"
          class="-mb-[6px] font-semibold rounded-full truncate"
          :class="[open && 'bg-(--ui-primary)/15 ']"
          :ui="{
            trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined]
              .filter(Boolean)
              .join(' ')
          }"
        />
      </UDropdownMenu>
    </template>

    <UNavigationMenu class="z-10" :items="items" variant="link" />

    <template #right>
      <UTooltip text="Search" :kbds="['meta', 'K']">
        <UContentSearchButton :label="null" />
      </UTooltip>

      <UColorModeButton />

      <template v-if="header?.links">
        <UButton
          v-for="(link, index) of header.links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>

    <template #body>
      <UNavigationMenu orientation="vertical" :items="links" class="-mx-2.5" />

      <USeparator type="dashed" class="mt-4 mb-6" />

      <UContentNavigation :navigation="navigation" highlight :ui="{ linkTrailingBadge: 'font-semibold uppercase' }">
        <template #link-title="{ link }">
          <span class="inline-flex items-center gap-0.5">
            {{ link.title }}
          </span>
        </template>
      </UContentNavigation>
    </template>
  </UHeader>
</template>
