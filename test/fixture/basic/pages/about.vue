<template>
  <div>
    <LangSwitcher />
    <div id="current-page">page: {{ $t('about') }}</div>
    <nuxt-link id="link-home" exact :to="localePath('index')">{{ $t('home') }}</nuxt-link>
    <div id="store-path-fr">{{ $store.state.routePathFr }}</div>
    <div id="locale-properties-code">code: {{ code }}</div>
  </div>
</template>

<script>
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  /** @return {import('../../../../types/vue').NuxtI18nMeta} */
  head () {
    return this.$nuxtI18nHead({ addSeoAttributes: { canonicalQueries: ['page'] } })
  },
  computed: {
    /** @return {string} */
    code () {
      return this.$i18n.localeProperties.code
    }
  },
  nuxtI18n: {
    paths: {
      en: '/about-us',
      fr: '/a-propos'
    }
  }
}
</script>
