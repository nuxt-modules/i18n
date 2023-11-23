<template>
  <div id="layer-page">
    <div id="i18n-layer-target">
      {{ $t('hello') }}
    </div>
    <div>
      <NuxtLink id="i18n-layer-parent-link" :to="localePath('/layer-parent')">Layer parent page</NuxtLink>
      <NuxtLink id="i18n-layer-parent-child-link" :to="localePath('/layer-parent/layer-child')">
        Layer parent-child page
      </NuxtLink>
    </div>
    <div>
      {{ switchLocalePath('nl') }}
      {{ switchLocalePath('fr') }}
      {{ switchLocalePath('en') }}
    </div>
  </div>
</template>

<script setup>
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
// const { locales } = useI18n()
</script>
