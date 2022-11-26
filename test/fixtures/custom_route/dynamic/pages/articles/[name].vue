<script setup lang="ts">
import { defineI18nRoute } from '#i18n'

defineI18nRoute({
  paths: {
    en: '/articles/[name]',
    fr: '/articles/[name]',
    ja: '/記事/[name]'
  }
})
</script>
