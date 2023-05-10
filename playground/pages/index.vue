<script setup lang="ts">
import { computed } from 'vue'

// import { useLocalePath, useSwitchLocalePath, useLocaleHead, useBrowserLocale } from '#i18n'
import { LocaleObject } from '#i18n'

const route = useRoute()
const { t, strategy, locale, locales, localeProperties, setLocale, finalizePendingLocaleChange } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const getRouteBaseName = useRouteBaseName()

// route.meta.pageTransition.onBeforeEnter = async () => {
//   await finalizePendingLocaleChange()
// }

console.log('route base name', getRouteBaseName())
console.log('useBrowserLocale', useBrowserLocale())
console.log('localeProperties', localeProperties)
console.log('foo', t('foo'))
console.log('message if local layer merged:', t('layerText'))
console.log('message if github layer merged:', t('layer-test-key'))

function getLocaleName(code: string) {
  const locale = (locales.value as LocaleObject[]).find(i => i.code === code)
  return locale ? locale.name : code
}

const availableLocales = computed(() => {
  return (locales.value as LocaleObject[]).filter(i => i.code !== locale.value)
})

definePageMeta({
  title: 'pages.title.top',
  middleware: () => {
    const localePath2 = useLocalePath()
    console.log('middleware', localePath2({ name: 'blog' }))
  },
  pageTransition: {
    name: 'page',
    mode: 'out-in',
    onBeforeEnter: async () => {
      const { finalizePendingLocaleChange } = useNuxtApp().$i18n
      await finalizePendingLocaleChange()
      console.log('onBeforeEnter')
    }
  }
})
</script>

<template>
  <div>
    <h1>Demo: Nuxt 3</h1>
    <h2>{{ $t('hello', { name: 'nuxt3' }) }}</h2>
    <p>{{ $t('bar.buz', { name: 'buz' }) }}</p>
    <h2>Pages</h2>
    <nav>
      <NuxtLink :to="localePath('/')">Home</NuxtLink> | <NuxtLink :to="localePath({ name: 'about' })">About</NuxtLink> |
      <NuxtLink :to="localePath({ name: 'blog' })">Blog</NuxtLink> |
      <NuxtLink :to="localePath({ name: 'category-id', params: { id: 'foo' } })">Category</NuxtLink> |
      <NuxtLink :to="localePath({ name: 'history' })">History</NuxtLink>
    </nav>
    <h2>Current Language: {{ getLocaleName(locale) }}</h2>
    <h2>Current Strategy: {{ strategy }}</h2>
    <h2>Select Languages with switchLocalePath</h2>
    <nav>
      <span v-for="locale in availableLocales" :key="locale.code">
        <NuxtLink :to="switchLocalePath(locale.code) || ''">{{ locale.name }}</NuxtLink> |
      </span>
    </nav>
    <h2>Select Languages with setLocale</h2>
    <nav>
      <span v-for="locale in availableLocales" :key="locale.code">
        <a href="javascript:void(0)" @click="setLocale(locale.code)">{{ locale.name }}</a> |
      </span>
    </nav>
    <p>{{ $t('settings.profile') }}</p>
    <p>{{ $t('tag') }}</p>
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: opacity 1s;
}
.page-enter,
.page-leave-active {
  opacity: 0;
}
</style>
