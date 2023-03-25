<template>
  <div id="layer-page">
    <div id="i18n-layer-target">
      {{ $t('hello') }}
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
// const { locales } = useI18n()
</script>
