<script lang="ts" setup>
import { useLocaleLocation, useLocalePath, useLocaleRoute } from '#i18n'

const localePath = useLocalePath()
const localeLocation = useLocaleLocation()
const localeRoute = useLocaleRoute()
</script>

<template>
  <div>
    <section id="locale-path">
      <span class="index">{{ localePath('/') }}</span>
      <span class="index-ja">{{ localePath('index', 'ja') }}</span>

      <!-- name -->
      <span class="about">{{ localePath('about') }}</span>

      <!-- path -->
      <span class="about-ja-path">{{ localePath('/about', 'ja') }}</span>
      <!-- <span class="not-found">{{ localePath('not-found') }}</span>
      <span class="not-found-ja">{{ localePath('not-found', 'ja') }}</span> -->
      <span class="not-found">{{ localePath('pathMatch') }}</span>
      <span class="not-found-ja">{{ localePath('pathMatch', 'ja') }}</span>

      <!-- object -->
      <span class="about-ja-name-object">{{ localePath({ name: 'about' }, 'ja') }}</span>

      <!-- omit name & path -->
      <span class="state-foo">{{ localePath({ state: { foo: 1 } }) }}</span>

      <!-- preserve query parameters -->
      <span class="query-foo">{{ localePath({ query: { foo: 1 } }) }}</span>
      <span class="query-foo-index">{{ localePath({ path: '/', query: { foo: 1 } }) }}</span>
      <span class="query-foo-name-about">{{ localePath({ name: 'about', query: { foo: 1 } }) }}</span>
      <span class="query-foo-path-about">{{ localePath({ path: '/about', query: { foo: 1 } }) }}</span>
      <span class="query-foo-string">{{ localePath('/?foo=1') }}</span>
      <span class="query-foo-string-about">{{ localePath('/about?foo=1') }}</span>
      <span class="query-foo-test-string">{{ localePath('/about?foo=1&test=2') }}</span>
      <span class="query-foo-path-param">{{ localePath('/path/as a test?foo=bar sentence') }}</span>
      <span class="query-foo-path-param-escaped">{{ localePath('/path/as%20a%20test?foo=bar%20sentence') }} </span>
      <span class="hash-path-about">{{ localePath({ path: '/about', hash: '#foo=bar' }) }}</span>

      <!-- no define path -->
      <span class="undefined-path">{{ localePath('/vue-i18n') }}</span>

      <!-- no define name -->
      <span class="undefined-name">{{ localePath('vue-i18n') }}</span>
    </section>
    <ClientOnly>
      <section id="locale-route">
        <span class="index">{{ localeRoute('/') }}</span>
        <span class="index-name-ja">{{ localeRoute('index', 'ja') }}</span>
        <span class="about-name">{{ localeRoute('about') }}</span>
        <span class="about-ja">{{ localeRoute('/about', 'ja') }}</span>
        <span class="about-name-ja">{{ localeRoute('about', 'ja') }}</span>
        <span class="about-object-ja">{{ localeRoute({ name: 'about' }, 'ja') }}</span>
        <span class="path-match-ja">{{ localeRoute('[...pathMatch]', 'ja') }}</span>
        <span class="path-match-name">{{ localeRoute('pathMatch') }}</span>
        <span class="path-match-name-ja">{{ localeRoute('pathMatch', 'ja') }}</span>
        <!-- <span class="-ja">{{ localeRoute('/vue-i18n', 'ja') }}</span> -->
        <span class="undefined-ja">{{ localeRoute('vue-i18n', 'ja') }}</span>
      </section>
    </ClientOnly>
    <ClientOnly>
      <section id="locale-location">
        <span class="index">{{ localeLocation('/') }}</span>
        <span class="index-name-ja">{{ localeLocation('index', 'ja') }}</span>
        <span class="about-name">{{ localeLocation('about') }}</span>
        <span class="about-ja">{{ localeLocation('/about', 'ja') }}</span>
        <span class="about-name-ja">{{ localeLocation('about', 'ja') }}</span>
        <span class="about-object-ja">{{ localeLocation({ name: 'about' }, 'ja') }}</span>
        <span class="path-match-ja">{{ localeLocation('[...pathMatch]', 'ja') }}</span>
        <span class="path-match-name">{{ localeLocation('pathMatch') }}</span>
        <span class="path-match-name-ja">{{ localeLocation('pathMatch', 'ja') }}</span>
        <!-- <span class="-ja">{{ localeLocation('/vue-i18n', 'ja') }}</span> -->
        <span class="undefined-ja">{{ localeLocation('vue-i18n', 'ja') }}</span>
      </section>
    </ClientOnly>
  </div>
</template>
