<template>
  <div>
    <LangSwitcher />
    <div id="current-page">page: {{ $t('home') }}</div>
    <nuxt-link id="link-about" exact :to="localePath('about')">{{ $t('about') }}</nuxt-link>
    <div id="current-locale">locale: {{ $i18n.locale }}</div>
  </div>
</template>

<script>
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  head () {
    return {
      ...this.$nuxtI18nHead(false),
      title: this.$t('home')
    }
  }
}
</script>
