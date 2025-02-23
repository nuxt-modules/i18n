<script setup lang="ts">
const versions = computed(() => {
  const items = [
    {
      id: '9',
      label: 'v9',
      to: '/docs/getting-started',
      tag: 'latest',
      click: () => {}
    },
    {
      id: '8',
      label: 'v8',
      to: '/docs/v8',
      click: () => {}
    },
    {
      id: '7',
      label: 'v7',
      to: '/docs/v7',
      tag: 'legacy',
      click: () => {}
    }
  ]

  return items.map(x => {
    x.click = () => changeVersion(x)
    return x
  })
})

const router = useRouter()
const selectedVersion = computed(() => {
  const path = router.currentRoute.value.path

  if (path.includes('/v8')) return versions.value[1]
  if (path.includes('/v7')) return versions.value[2]

  return versions.value[0]
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
    <ClientOnly>
      <USelectMenu
        :model-value="selectedVersion"
        :options="versions"
        :ui="{ base: '!cursor-pointer' }"
        :popper="{ placement: 'bottom-start' }"
        :uiMenu="{ option: { base: '!cursor-pointer', container: 'w-full' } }"
        color="gray"
      >
        <template #label>
          {{ selectedVersion.label }}
          <UBadge v-if="selectedVersion.tag" variant="subtle" :label="selectedVersion.tag" size="xs" />
        </template>

        <template #option="{ option }">
          <div class="absolute inset-0" @click="option.click"></div>
          <div class="w-full">
            {{ option.label }}
            <UBadge v-if="option.tag" variant="subtle" :label="option.tag" />
          </div>
        </template>
      </USelectMenu>
    </ClientOnly>
  </div>
</template>
