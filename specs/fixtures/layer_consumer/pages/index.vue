<script setup lang="ts">
import { useHead } from '#imports'
import { useI18n, useLocalePath, useLocaleHead } from '#i18n'
import LangSwitcher from '../components/LangSwitcher.vue'

const { t } = useI18n()
const localePath = useLocalePath()
const i18nHead = useLocaleHead({ addSeoAttributes: { canonicalQueries: ['page'] } })

useHead({
  title: 'Home',
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs!.lang
  },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])]
})
</script>

<template>
  <div>
    <div id="layer-message">{{ $t('thanks') }}</div>
    <div id="snake-case">{{ $t('snakeCaseText') }}</div>
    <div id="pascal-case">{{ $t('pascalCaseText') }}</div>
    <div id="fallback-message">{{ $t('uniqueTranslation') }}</div>
    <LangSwitcher />
    <section>
      <strong><code>useHead</code> with <code>useLocaleHead</code></strong
      >:
      <code id="home-use-locale-head">{{ i18nHead }}</code>
    </section>
  </div>
</template>
