<script setup lang="ts">
const versions = [
  {
    id: '8',
    label: 'v8',
    to: '/docs/getting-started',
    tag: 'latest'
  },
  {
    id: '9',
    label: 'v9',
    to: '/docs/v9',
    tag: 'alpha'
  },
  {
    id: '7',
    label: 'v7',
    to: '/docs/v7'
  }
]

const route = useRoute()
const selectedVersion = computed(() =>
  route.path.includes('/v9') ? versions[1] : route.path.includes('/v7') ? versions[2] : versions[0]
)
function changeVersion(newVersion) {
  return navigateTo(newVersion.to)
}
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
        <div @click="changeVersion(version)" class="w-full">
          {{ version.label }}
          <UBadge v-if="version.tag" variant="subtle" :label="version.tag" />
        </div>
      </template>
    </USelectMenu>
  </div>
</template>
