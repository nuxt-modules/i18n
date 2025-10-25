<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '#ui/types'

const props = defineProps<{ links?: NavigationMenuItem[] }>()

const appConfig = useAppConfig()
const config = useRuntimeConfig()
const { $currentDocsVersionNavigation } = useNuxtApp()

const processed = computed<DropdownMenuItem[]>(() => {
  const items = [
    { label: `v${config.public.version}`, version: 10, to: '/docs' },
    { label: `v9.5.3`, version: 9, to: 'https://v9.i18n.nuxtjs.org/docs' },
    { label: 'v8.5.6', version: 8, to: 'https://v9.i18n.nuxtjs.org/docs/v8/getting-started' },
    { label: 'v7.3.1', version: 7, to: 'https://v9.i18n.nuxtjs.org/docs/v7/setup' }
  ]

  return items.map(x => {
    const isActive = 10 === x.version
    return {
      ...x,
      color: (isActive && 'primary') || undefined,
      active: isActive,
      checked: isActive,
      type: (isActive && 'checkbox') || undefined
    }
  })
})
</script>

<template>
  <UHeader :menu="{ shouldScaleBackground: true }">
    <template #left>
      <NuxtLink
        to="/"
        class="flex items-end gap-2 font-bold text-lg text-(--ui-text-highlighted) min-w-0 focus-visible:outline-(--ui-primary) shrink-0"
      >
        <Logo class="w-auto h-8 shrink-0" />
      </NuxtLink>
      <UDropdownMenu
        v-slot="{ open }"
        :modal="false"
        :items="processed"
        :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width) min-w-0' }"
        size="xs"
        class="hidden sm:flex"
      >
        <UButton
          :label="`v${config.public.version}`"
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

    <UNavigationMenu class="z-10" :items="links" variant="link" />

    <template #right>
      <!-- <UTooltip text="Search" :kbds="['meta', 'K']"> -->
      <UContentSearchButton :label="null" />
      <!-- </UTooltip> -->

      <UColorModeButton class="hidden sm:flex" />

      <template v-if="appConfig.header?.links">
        <UButton
          v-for="(link, index) of appConfig.header.links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>

    <template #body>
      <UNavigationMenu orientation="vertical" :items="links" class="-mx-2.5" />

      <USeparator type="dashed" class="mt-4 mb-6" />

      <UContentNavigation
        :navigation="$currentDocsVersionNavigation"
        highlight
        :ui="{ linkTrailingBadge: 'font-semibold uppercase' }"
      />
    </template>
  </UHeader>
</template>
