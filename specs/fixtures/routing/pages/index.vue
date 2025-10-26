<script lang="ts" setup>
import { useLocalePath, useLocaleRoute } from '#i18n'

const localePath = useLocalePath()
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

      <!-- external -->
      <span class="external-link">{{ localePath('https://github.com') }}</span>
      <span class="external-mail">{{ localePath('mailto:example@mail.com') }}</span>
      <span class="external-phone">{{ localePath('tel:+31612345678') }}</span>

      <!-- #3840 -->
      <span data-testid="current-localized-route-param">{{ localePath($route, 'ja') }}</span>
      <span data-testid="object-localized-route-param">{{ localePath({ name: 'index___en'}, 'ja') }}</span>
    </section>
    <ClientOnly>
      <section id="locale-route">
        <span class="index">{{ JSON.stringify(localeRoute('/')) }}</span>
        <span class="index-name-ja">{{ JSON.stringify(localeRoute('index', 'ja')) }}</span>
        <span class="about-name">{{ JSON.stringify(localeRoute('about')) }}</span>
        <span class="about-ja">{{ JSON.stringify(localeRoute('/about', 'ja')) }}</span>
        <span class="about-name-ja">{{ JSON.stringify(localeRoute('about', 'ja')) }}</span>
        <span class="about-object-ja">{{ JSON.stringify(localeRoute({ name: 'about' }, 'ja')) }}</span>
        <span class="path-match-ja">{{ JSON.stringify(localeRoute('/:pathMatch(.*)*', 'ja')) }}</span>
        <span class="path-match-name">{{ JSON.stringify(localeRoute('pathMatch')) }}</span>
        <span class="path-match-name-ja">{{ JSON.stringify(localeRoute('pathMatch', 'ja')) }}</span>
        <span class="undefined-path-ja">{{ JSON.stringify(localeRoute('/vue-i18n', 'ja')) }}</span>
        <span class="undefined-name-ja">{{ JSON.stringify(localeRoute('vue-i18n', 'ja')) }}</span>
      </section>
    </ClientOnly>
  </div>
</template>

<style>
span {
  display: block;
}
</style>
