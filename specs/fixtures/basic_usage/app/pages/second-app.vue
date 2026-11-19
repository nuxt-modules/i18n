<script setup lang="ts">
import { createApp, reactive, shallowReactive } from 'vue'
import { applyPlugins, createNuxtApp } from '#app/nuxt'
import plugins from '#build/plugins'

// boots a second Nuxt app next to the page's own, as `@nuxtjs/storybook` does for every story
const main = useNuxtApp()
const switchedPath = ref('')

onMounted(async () => {
  const second = createNuxtApp({
    id: 'second',
    vueApp: createApp({ render: () => null }),
    payload: shallowReactive({
      _errors: shallowReactive({}),
      config: main.$config,
      data: shallowReactive({}),
      once: new Set<string>(),
      path: '/?',
      serverRendered: false,
      state: reactive({}),
    }),
  } as never)
  await second.runWithContext(() => applyPlugins(second, plugins))

  // only the second app navigates, so the path it switches to shows which router it reads
  await second.$router.push('/about')
  switchedPath.value = second.$switchLocalePath('fr')
})
</script>

<template>
  <div>
    <code id="second-app-switched-path">{{ switchedPath }}</code>
  </div>
</template>
