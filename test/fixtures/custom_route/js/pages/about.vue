<script setup>
import { defineI18nRoute } from '#i18n'

defineI18nRoute({
  paths: {
    en: '/about-us',
    fr: '/a-propos',
    ja: '/about-ja'
  }
})
</script>

<template>
  <p>Foo</p>
</template>

<style>
p {
  color: red;
}
</style>
