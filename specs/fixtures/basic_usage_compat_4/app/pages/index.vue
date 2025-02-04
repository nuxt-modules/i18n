<script setup lang="ts">
import { useI18n, useLocaleHead, useLocalePath, useLocaleRoute, useSwitchLocalePath } from '#i18n'
import {
  computed,
  navigateTo,
  ref,
  useAppConfig,
  useAsyncData,
  useHead,
  useRoute,
  useRuntimeConfig,
  watch
} from '#imports'
import LangSwitcher from '../components/LangSwitcher.vue'
import LocalScope from '../components/LocalScope.vue'

const { t, locale, locales, localeProperties, finalizePendingLocaleChange } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const localeRoute = useLocaleRoute()
const appConfig = useAppConfig()

const category = ref({
  title: 'Kirby',
  slug: 'nintendo'
})

const normalizedLocales = computed(() =>
  locales.value.map(x => (typeof x === 'string' ? { code: x, name: x } : { code: x.code, name: x.name ?? x.code }))
)

function onClick() {
  const route = localeRoute({ name: 'user-profile', query: { foo: '1' } })
  if (route) {
    return navigateTo(route.fullPath)
  }
}
const { data, refresh } = useAsyncData('home', () =>
  Promise.resolve({
    aboutPath: localePath('about'),
    aboutTranslation: t('about')
  })
)

watch(locale, () => {
  refresh()
})
const route = useRoute()
route.meta.pageTransition = {
  name: 'my',
  mode: 'out-in',
  onBeforeEnter: async () => {
    if (useRuntimeConfig().public.i18n.skipSettingLocaleOnNavigate) {
      await finalizePendingLocaleChange()
    }
  }
}
// @ts-ignore
definePageMeta({
  title: 'home',
  alias: ['/aliased-home-path']
})

const i18nHead = useLocaleHead({ key: 'id', seo: { canonicalQueries: ['page', 'canonical'] } })
useHead(() => ({
  htmlAttrs: {
    lang: i18nHead.value.htmlAttrs!.lang
  },
  link: [...(i18nHead.value.link || [])],
  meta: [...(i18nHead.value.meta || [])]
}))
</script>

<template>
  <div>
    <section id="vue-i18n-usage">
      <form>
        <select v-model="locale">
          <option value="en">en</option>
          <option value="fr">fr</option>
        </select>
        <p>{{ $t('welcome') }}</p>
      </form>
    </section>
    <LangSwitcher />
    <section>
      <strong>resolve with <code>useAsyncData</code></strong
      >:
      <code id="home-use-async-data">{{ data }}</code>
    </section>
    <section>
      <strong><code>useHead</code> with <code>useLocaleHead</code></strong
      >:
      <code id="home-use-locale-head">{{ i18nHead }}</code>
    </section>
    <section id="t-directive">
      <p id="t-directive-path" v-t="'welcome'"></p>
      <p id="t-directive-argument" v-t="{ path: 'helloMessage', args: { name: 'directive' } }"></p>
    </section>
    <section id="locale-path-usages">
      <h3>localePath</h3>
      <ul>
        <li class="name">
          <NuxtLink :to="localePath('index')">{{ $t('home') }}</NuxtLink>
        </li>
        <li class="path">
          <NuxtLink :to="localePath('/')">{{ $t('home') }}</NuxtLink>
        </li>
        <li class="named-with-locale">
          <NuxtLink :to="localePath('index', 'fr')">Homepage in French</NuxtLink>
        </li>
        <li class="nest-path">
          <NuxtLink :to="localePath('/user/profile')">Route by path to: {{ $t('profile') }}</NuxtLink>
        </li>
        <li class="nest-named">
          <NuxtLink :to="localePath('user-profile')">Route by name to: {{ $t('profile') }}</NuxtLink>
        </li>
        <li class="object-with-named">
          <NuxtLink :to="localePath({ name: 'category-slug', params: { slug: category.slug } })">
            {{ category.title }}
          </NuxtLink>
        </li>
        <li class="path-about">
          <NuxtLink id="link-about" :to="localePath('/about')">{{ $t('about') }}</NuxtLink>
        </li>
        <li>
          <NuxtLink id="link-post" :to="localePath({ name: 'post-id', params: { id: 'id' } })">Post</NuxtLink>
        </li>
        <li>
          <NuxtLink id="link-greetings" :to="localePath('greetings')">Greetings</NuxtLink>
        </li>
        <li class="path-hash">
          <NuxtLink id="link-about-hash" :to="localePath('/about#my-hash')">{{ $t('about') }}</NuxtLink>
        </li>
        <li class="path-query-hash">
          <NuxtLink id="link-about-query-hash" :to="localePath('/about?foo=bar#my-hash')">
            {{ $t('about') }}
          </NuxtLink>
        </li>
        <li class="path-hash">
          <NuxtLink id="link-about-hash-object" :to="localePath({ name: 'about', hash: '#my-hash' })">{{
            $t('about')
          }}</NuxtLink>
        </li>
        <li class="path-query-hash">
          <NuxtLink
            id="link-about-query-hash-object"
            :to="localePath({ name: 'about', query: { foo: 'bar' }, hash: '#my-hash' })"
          >
            {{ $t('about') }}
          </NuxtLink>
        </li>
        <li class="path-spaces">
          <NuxtLink id="link-page-with-spaces" :to="localePath({ name: 'page with spaces' })">
            To the page with spaces!
          </NuxtLink>
        </li>
        <li class="path-spaces-encoded">
          <NuxtLink id="link-page-with-spaces-encoded" :to="localePath(`/${encodeURI('page with spaces')}`)">
            To the page with spaces!
          </NuxtLink>
        </li>
      </ul>
    </section>
    <section id="nuxt-link-locale-usages">
      <h3>NuxtLinkLocale</h3>
      <ul>
        <li class="name">
          <NuxtLinkLocale :to="'index'">{{ $t('home') }}</NuxtLinkLocale>
        </li>
        <li class="path">
          <NuxtLinkLocale :to="'/'">{{ $t('home') }}</NuxtLinkLocale>
        </li>
        <li class="named-with-locale">
          <NuxtLinkLocale :to="'index'" :locale="'fr'">Homepage in French</NuxtLinkLocale>
        </li>
        <li class="nest-path">
          <NuxtLinkLocale :to="'/user/profile'">Route by path to: {{ $t('profile') }}</NuxtLinkLocale>
        </li>
        <li class="nest-named">
          <NuxtLinkLocale :to="'user-profile'">Route by name to: {{ $t('profile') }}</NuxtLinkLocale>
        </li>
        <li class="object-with-named">
          <NuxtLinkLocale :to="{ name: 'category-slug', params: { slug: category.slug } }">
            {{ category.title }}
          </NuxtLinkLocale>
        </li>
        <li class="external-url">
          <NuxtLinkLocale :to="'https://nuxt.com/'">Nuxt.com</NuxtLinkLocale>
        </li>
      </ul>
    </section>
    <section id="switch-locale-path-usages">
      <h3>switchLocalePath</h3>
      <ul>
        <li v-for="locale of normalizedLocales" :key="locale.code" :class="`switch-to-${locale.code}`">
          <NuxtLink :to="switchLocalePath(locale.code)">{{ locale.name }}</NuxtLink>
        </li>
      </ul>
    </section>
    <section id="locale-route-usages">
      <h3>localeRoute</h3>
      <button @click="onClick">Show profile</button>
    </section>
    <section>
      <code id="register-module">{{ $t('moduleLayerText') }}</code>
    </section>
    <section>
      <p id="app-config-name">{{ appConfig?.myProject?.name }}</p>
    </section>
    <section>
      <div id="layer-message">{{ $t('thanks') }}</div>
      <div id="snake-case">{{ $t('snakeCaseText') }}</div>
      <div id="pascal-case">{{ $t('pascalCaseText') }}</div>
      <div id="fallback-message">{{ $t('uniqueTranslation') }}</div>
    </section>
    <section>
      <div id="home-header">{{ $t('modifier') }}</div>
    </section>
    <section>
      <div id="fallback-key">{{ $t('fallbackMessage') }}</div>
    </section>
    <section>
      <div id="runtime-config">{{ $t('runtimeKey') }}</div>
    </section>
    <section>
      <div id="module-layer-base-key">{{ $t('moduleLayerBaseKey') }}</div>
      <div id="module-layer-base-key-named">{{ $t('moduleLayerBaseKeyNamed', { name: 'bar' }) }}</div>
    </section>
    <section>
      <div id="issue-2094">{{ $t('variableExportedI18nConfig') }}</div>
    </section>
    <section>
      <code id="global-scope-properties">{{ localeProperties }}</code>
      <LocalScope />
    </section>
    <section>
      <div id="install-module-locale">{{ $t('installerModuleLocaleMessage') }}</div>
      <div id="install-module-vue-i18n">{{ $t('installerModuleVueI18nMessage') }}</div>
    </section>
  </div>
</template>
