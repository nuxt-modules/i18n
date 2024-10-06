<script setup lang="ts">
import type { NavItem } from '@nuxt/content'

// Get navigation tree relative to the '/content/docs'
const navigation = inject<Ref<NavItem[]>>('navigation')
const { navPageFromPath } = useContentHelpers()
const allNavigationTree = computed(() =>
  mapContentNavigation(navPageFromPath('/docs', navigation.value)?.children || [])
)

const router = useRouter()
const appConfig = useAppConfig()

const isV7Docs = computed(() => router.currentRoute.value.path.includes('/docs/v7'))
const isV8Docs = computed(() => router.currentRoute.value.path.includes('/docs/v8'))

watch(
  () => router.currentRoute.value.path,
  () => {
    const versionTheme = isV8Docs.value || isV7Docs.value ? 'legacy' : 'default'

    appConfig.ui.primary = appConfig[versionTheme].ui.primary
    appConfig.ui.gray = appConfig[versionTheme].ui.gray
  },
  { immediate: true }
)

const v7DocsRE = /^\/docs\/v7/
const v8DocsRE = /^\/docs\/v8/

const navigationV7 = computed(() => allNavigationTree.value.filter(x => v7DocsRE.test(String(x.to))))
const navigationV8 = computed(() => allNavigationTree.value.filter(x => v8DocsRE.test(String(x.to))))
const navigationDefault = computed(() =>
  allNavigationTree.value.filter(x => {
    const to = String(x.to)
    return !v8DocsRE.test(to) && !v7DocsRE.test(to)
  })
)

const currentVersionNavigation = computed(() => {
  if (isV7Docs.value) return navigationV7.value
  if (isV8Docs.value) return navigationV8.value
  return navigationDefault.value
})
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside>
          <VersionSelect />
          <UDivider type="dashed" class="mb-6" />
          <UNavigationTree :links="currentVersionNavigation" default-open :multiple="false" />
        </UAside>
      </template>

      <slot />
    </UPage>
  </UContainer>
</template>
