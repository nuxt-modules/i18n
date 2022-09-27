<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#i18n'
import LangSwitcher from '../../components/LangSwitcher.vue'

const { localeProperties, t } = useI18n()
const code = computed(() => {
  return localeProperties.value.code
})
</script>

<template>
  <div>
    <p>{{ t('pages.blog.article') }}</p>
    <LangSwitcher />
    <section>
      <strong
        >code: <code id="locale-properties-code">{{ code }}</code></strong
      >
    </section>
  </div>
</template>
