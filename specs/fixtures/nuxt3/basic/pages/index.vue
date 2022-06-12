<script setup lang="ts">
import LangSwitcher from '../components/LangSwitcher.vue'
import { useI18n, useLocalePath, useLocaleHead } from '#i18n'

const { t, locales } = useI18n()
const localePath = useLocalePath()
const i18nHead = useLocaleHead({ addSeoAttributes: false })
const { data, refresh } = useAsyncData('home', () =>
  Promise.resolve({
    aboutPath: localePath('about'),
    aboutTranslation: t('about')
  })
)

onMounted(() => {
  console.log('onMounted: locales', locales)
  console.log('onMounted: useAsyncData', data)
})

watchEffect(() => {
  refresh()
})

useHead({
  title: t('home'),
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs!.lang
  },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])]
})
</script>

<template>
  <div>
    <h1>{{ $t('home') }}</h1>
    <LangSwitcher />
    <p>resolved useAsyncData: {{ data }}</p>
    <p>{{ i18nHead }}</p>
  </div>
</template>
