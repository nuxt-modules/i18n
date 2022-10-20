<script setup lang="ts">
import { watchEffect } from 'vue'
import { useAsyncData } from '#imports'
import { useI18n, useLocalePath } from '#i18n'
import LangSwitcher from '../components/LangSwitcher.vue'

const { t } = useI18n()
const localePath = useLocalePath()
const { data, refresh } = useAsyncData('home', () =>
  Promise.resolve({
    aboutPath: localePath('about'),
    aboutTranslation: t('about')
  })
)

watchEffect(() => {
  refresh()
})

// @ts-ignore
definePageMeta({
  title: 'home'
})
</script>

<template>
  <div>
    <h1 id="home-header">{{ $t('home') }}</h1>
    <LangSwitcher />
    <section>
      <strong>resolve with <code>useAsyncData</code></strong
      >:
      <code id="home-use-async-data">{{ data }}</code>
    </section>
    <NuxtLink id="link-about" exact :to="localePath('about')">{{ $t('about') }}</NuxtLink>
    <NuxtLink id="link-blog" :to="localePath({ name: 'blog' })">{{ $t('posts') }}</NuxtLink>
    <NuxtLink id="link-category" :to="localePath({ name: 'categories', params: { id: 'foo' } })">{{
      $t('categories')
    }}</NuxtLink>
  </div>
</template>
