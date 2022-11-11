<script setup lang="ts">
import { defineI18nRoute } from '#i18n'

defineI18nRoute({
  paths: {
    en: '/about-us',
    fr: '/a-propos',
    ja: '/about-ja'
  }
})

definePageMeta({
  layout: false
})
</script>
