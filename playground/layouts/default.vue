<script lang="ts" setup>
const { locales } = useI18n()
</script>

<template>
  <div>
    <div style="display: flex; gap: 1em">
      <SwitchLocalePathLink v-for="l of locales" :key="l.code" :locale="l.code">{{ l.name }}</SwitchLocalePathLink>
    </div>
    <slot />
  </div>
</template>
