<template>
  <div>
    <LangSwitcher />
    <div id="current-page">page: {{ $t('about') }}</div>
    <nuxt-link id="link-home" exact :to="localePath('index')">{{ $t('home') }}</nuxt-link>
  </div>
</template>

<script>
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  nuxtI18n: {
    paths: {
      en: '/about-us',
      fr: '/a-propos'
    }
  }
}
</script>
