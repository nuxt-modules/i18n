<script setup lang="ts">
import { useLocaleHead, useLocalePath, useLocaleRoute, useRouteBaseName, useSwitchLocalePath } from '#i18n'
import { computed, useHead } from '#imports'

const localePath = useLocalePath()
const localeRoute = useLocaleRoute()
const switchLocalePath = useSwitchLocalePath()
const routeBaseName = useRouteBaseName()
const localeHead = useLocaleHead({ addDirAttribute: true, identifierAttribute: 'id', addSeoAttributes: true })

const metaTestEntries = computed(() => [
  { id: 'locale-path', content: localePath('/nested/test-route') },
  { id: 'locale-route', content: localeRoute('/nested/test-route')?.fullPath ?? '' },
  { id: 'switch-locale-path', content: switchLocalePath('fr') },
  { id: 'route-base-name', content: routeBaseName(localeRoute('/nested/test-route', 'fr')) ?? '' }
])

useHead({
  htmlAttrs: {
    ...localeHead.value.htmlAttrs
  },
  link: () => [...(localeHead.value.link ?? [])],
  meta: () => [...(localeHead.value.meta ?? []), ...metaTestEntries.value]
})
</script>

<template>
  <div>Tests composables using useHead</div>
</template>
