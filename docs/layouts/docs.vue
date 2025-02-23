<script setup lang="ts">
const router = useRouter()
const appConfig = useAppConfig()
const { $currentDocsVersion, $currentDocsVersionNavigation } = useNuxtApp()

watch(
  () => router.currentRoute.value.path,
  () => {
    const versionTheme = $currentDocsVersion.value === 9 ? 'default' : 'legacy'

    appConfig.ui.colors.primary = appConfig[versionTheme].ui.primary
    appConfig.ui.colors.neutral = appConfig[versionTheme].ui.neutral
  },
  { immediate: true }
)
</script>

<template>
  <UMain>
    <UContainer>
      <UPage>
        <template #left>
          <UPageAside>
            <UContentNavigation
              :navigation="$currentDocsVersionNavigation"
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
