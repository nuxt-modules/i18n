<script setup lang="ts">
const versions = [
  {
    id: '8',
    label: 'v8',
    to: '/docs/getting-started',
    latest: true
  },
  {
    id: '7',
    label: 'v7',
    to: '/docs/v7'
  }
]

const route = useRoute()
const selectedVersion = computed(() => (route.path.includes('/v7') ? versions[1] : versions[0]))
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
        <UBadge v-if="selectedVersion.latest" variant="subtle" label="latest" size="xs" />
      </template>

      <template #option="{ option: version }">
        <div @click="changeVersion(version)" class="w-full">
          {{ version.label }}
          <UBadge v-if="version.latest" variant="subtle" label="latest" />
        </div>
      </template>
    </USelectMenu>
  </div>
</template>
