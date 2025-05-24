<script setup lang="ts">
import { defineI18nRoute } from '#i18n'

defineI18nRoute({
  locales: ['fr', 'ja']
})
definePageMeta({
  i18n: {
    locales: ['fr']
  }
})
</script>
