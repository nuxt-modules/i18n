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

// console.log('route base name', getRouteBaseName())
// console.log('useBrowserLocale', useBrowserLocale())
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

const i = tm('items') || []
console.log('items via tm', i, typeof i)
const items = i.map(item => rt(item?.name ?? ''))
console.log('items items', items)

definePageMeta({
  title: 'pages.title.top',
  // middleware: () => {
  //   const localePath2 = useLocalePath()
  //   console.log('middleware', localePath2({ name: 'blog' }))
  // },
  pageTransition: {
    name: 'page',
    mode: 'out-in',
    onBeforeEnter: async () => {
      const { finalizePendingLocaleChange } = useNuxtApp().$i18n
      await finalizePendingLocaleChange()
      // console.log('onBeforeEnter')
    }
  }
})
</script>

<template>
  <div>
    <h1>Demo: Nuxt 3</h1>
    <section>
      <p>Current Language: {{ getLocaleName(locale) }}</p>
      <p>Current Strategy: {{ strategy }}</p>
    </section>
    <section>
      <h3 class="margin-bottom: 0;">Language switchers</h3>
      <div style="display: flex; column-gap: 1em">
        <div>
          <span>`switchLocalePath` switcher</span>
          <ul>
            <li v-for="locale in availableLocales" :key="locale.code">
              <NuxtLink :to="switchLocalePath(locale.code) || ''">{{ locale.name }}</NuxtLink>
            </li>
          </ul>
        </div>
        <div>
          <span>`setLocale` switcher</span>
          <ul>
            <li v-for="locale in availableLocales" :key="locale.code">
              <a href="javascript:void(0)" @click="setLocale(locale.code)">{{ locale.name }}</a>
            </li>
          </ul>
        </div>
      </div>
    </section>
    <section>
      <h3>Pages</h3>
      <ul>
        <li>
          <NuxtLink :to="localePath('index')">Home</NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath({ name: 'about' })">About</NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath({ name: 'blog' })">Blog</NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath({ name: 'server' })">Server</NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath({ name: 'category-id', params: { id: 'foo' } })">Category</NuxtLink>
        </li>
        <li>
          <NuxtLinkLocale :to="{ name: 'history' }" class="history-link">History</NuxtLinkLocale>
        </li>
        <li>
          <NuxtLinkLocale to="index" locale="ja" activeClass="link-active">Home (Japanese)</NuxtLinkLocale>
        </li>
        <li>
          <NuxtLinkLocale :to="{ name: 'products' }" class="products-link">Products</NuxtLinkLocale>
        </li>
      </ul>
    </section>
    <section>
      <h3>Translations</h3>
      <p>{{ $t('hello', { name: 'nuxt3' }) }}</p>
      <p>{{ $t('snakeCaseText') }}</p>
      <p>{{ $t('pascalCaseText') }}</p>
      <p>{{ $t('bar.buz', { name: 'buz' }) }}</p>
      <p>{{ $t('settings.profile', {}, { locale: 'en' }) }}</p>
      <p>{{ $t('tag') }}</p>
      <div>v-t directive: <code v-t="{ path: 'hello', args: { name: 'v-t' } }"></code></div>
      <p>Items</p>
      <ul>
        <li v-for="item in items">{{ item }}</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
section {
  margin: 2em 0em;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.5s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.link-active {
  color: rgb(51, 175, 51);
}
</style>
