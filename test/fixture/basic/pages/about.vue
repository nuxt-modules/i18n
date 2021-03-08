<template>
  <div>
    <LangSwitcher />
    <div id="current-page">page: {{ $t('about') }}</div>
    <nuxt-link id="link-home" exact :to="localePath('index')">{{ $t('home') }}</nuxt-link>
    <div id="store-path-fr">{{ $store.state.routePathFr }}</div>
  </div>
</template>

<script>
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  head () {
    return this.$nuxtI18nHead()
  },
  nuxtI18n: {
    paths: {
      en: '/about-us',
      fr: '/a-propos'
    }
  }
}
</script>
