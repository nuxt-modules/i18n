<template>
  <div>
    <h1 id="disable-route-text">Page with disabled localized route</h1>
    <p id="disable-route-translation">{{ $t('home') }}</p>
    <nuxt-link id="goto-home" :to="$localePath('/')"> Goto Home </nuxt-link>
  </div>
</template>

<script lang="ts" setup>
defineI18nRoute(false)
</script>
