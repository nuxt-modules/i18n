<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const {
  t,
  rt,
  tm,
  strategy,
  locale,
  locales,
  localeProperties,
  setLocale,
  defaultLocale,
  finalizePendingLocaleChange
} = useI18n()
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
console.log('experimental module', t('goodDay'))

function getLocaleName(code: string) {
  const locale = locales.value.find(i => i.code === code)
  return locale ? locale.name : code
}

const availableLocales = computed(() => {
  return locales.value.filter(i => i.code !== locale.value)
})

const i = tm('items')
console.log('items via tm', i, typeof i)
const items = i.map(item => rt(item.name))
console.log('items items', items)

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
    <p>{{ $t('snakeCaseText') }}</p>
    <p>{{ $t('pascalCaseText') }}</p>
    <p>{{ $t('bar.buz', { name: 'buz' }) }}</p>
    <h2>Pages</h2>
    <nav>
      <NuxtLink :to="localePath('/')">Home</NuxtLink> | <NuxtLink :to="localePath({ name: 'about' })">About</NuxtLink> |
      <NuxtLink :to="localePath({ name: 'blog' })">Blog</NuxtLink> |
      <NuxtLink :to="localePath({ name: 'server' })">Server</NuxtLink> |
      <NuxtLink :to="localePath({ name: 'category-id', params: { id: 'foo' } })">Category</NuxtLink> |
      <NuxtLinkLocale :to="{ name: 'history' }" class="history-link">History</NuxtLinkLocale> |
      <NuxtLinkLocale :to="'/'" locale="ja" activeClass="link-active">Home (Japanese)</NuxtLinkLocale> |
      <NuxtLinkLocale :to="{ name: 'products' }" class="products-link">Products</NuxtLinkLocale>
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
    <h3>Items</h3>
    <div v-for="item in items">
      <p>{{ item }}</p>
    </div>
    <!-- <div>v-t directive: <code v-t="{ path: 'hello', args: { name: 'v-t' } }"></code></div> -->
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

.link-active {
  color: rgb(51, 175, 51);
}
</style>
