<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const router = useRouter()
const appConfig = useAppConfig()

const isV9Docs = inject<ComputedRef<boolean>>('isV9Docs')

watch(
  () => router.currentRoute.value.path,
  (val, _oldVal) => {
    const versionTheme = !isV9Docs.value ? 'legacy' : 'default'

    appConfig.ui.colors.primary = appConfig[versionTheme].ui.primary
    appConfig.ui.colors.neutral = appConfig[versionTheme].ui.neutral
  },
  { immediate: true }
)

const currentVersionNavigation = inject<ContentNavigationItem[]>('currentVersionNavigation')
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <UContentNavigation
              :navigation="currentVersionNavigation"
              highlight
              :ui="{ linkTrailingBadge: 'font-semibold uppercase' }"
            >
              <template #link-title="{ link }">
                <span class="inline-flex items-center gap-0.5">
                  {{ link.title }}
                </span>
              </template>
            </UContentNavigation>
          </UPageAside>
        </template>

        <slot />
      </UPage>
    </UContainer>
  </UMain>
</template>
