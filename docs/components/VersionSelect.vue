<script setup lang="ts">
const versions = [
  {
    id: '9',
    label: 'v9',
    to: '/docs/getting-started',
    tag: 'rc'
  },
  {
    id: '8',
    label: 'v8',
    to: '/docs/v8',
    tag: 'stable'
  },
  {
    id: '7',
    label: 'v7',
    to: '/docs/v7'
  }
]

const router = useRouter()
const selectedVersion = computed(() => {
  const path = router.currentRoute.value.path

  if (path.includes('/v8')) return versions[1]
  if (path.includes('/v7')) return versions[2]

  return versions[0]
})

function changeVersion(newVersion) {
  return navigateTo(newVersion.to)
}

watch(selectedVersion, val => {
  changeVersion(val)
})
</script>

<template>
  <div class="mb-3 lg:mb-6">
    <USelectMenu
      :model-value="selectedVersion"
      :options="versions"
      :ui="{ base: '!cursor-pointer' }"
      :uiMenu="{ option: { base: '!cursor-pointer', container: 'w-full' } }"
      color="gray"
    >
      <template #label>
        {{ selectedVersion.label }}
        <UBadge v-if="selectedVersion.tag" variant="subtle" :label="selectedVersion.tag" size="xs" />
      </template>

      <template #option="{ option: version }">
        <div class="absolute inset-0" @click="() => changeVersion(version)"></div>
        <div class="w-full">
          {{ version.label }}
          <UBadge v-if="version.tag" variant="subtle" :label="version.tag" />
        </div>
      </template>
    </USelectMenu>
  </div>
</template>
