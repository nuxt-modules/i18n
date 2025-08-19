<script setup lang="ts">
// macro parsing should work when importing types (#3785)
import type { AsyncData } from 'nuxt/app'
import { defineI18nRoute } from '#i18n'

defineI18nRoute({
  paths: {
    en: '/about-us',
    fr: '/a-propos',
    ja: '/about-ja'
  }
})

definePageMeta({
  i18n: {
    paths: {
      en: '/about-us',
      fr: '/a-propos',
      ja: '/about-ja'
    }
  }
})
</script>
