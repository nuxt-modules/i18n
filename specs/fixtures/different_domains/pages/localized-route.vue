<script setup>
import BasicUsage from '../components/BasicUsage.vue'
import LangSwitcher from '../components/LangSwitcher.vue'

// for customRoutes: 'page' option
// see /specs/different_domains/different_domains_custom_routes.spec.ts
defineI18nRoute({
  locales: ['en', 'fr']
})
</script>

<template>
  <div>
    <BasicUsage />
    <LangSwitcher />
  </div>
</template>
