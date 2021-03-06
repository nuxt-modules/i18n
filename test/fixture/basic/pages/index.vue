<template>
  <div>
    <LangSwitcher />
    <div id="current-page">page: {{ $t('home') }}</div>
    <nuxt-link id="link-about" exact :to="localePath('about')">{{ $t('about') }}</nuxt-link>
    <div id="current-locale">locale: {{ $i18n.locale }}</div>
  </div>
</template>

<script>
import Vue from 'vue'
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  head () {
    return {
      ...this.$nuxtI18nHead({ addDirAttribute: false }),
      title: this.$t('home')
    }
  },
  created () {
    // This tests the case where klona tries to clone reactive object instead of an original one.
    // https://github.com/nuxt-community/i18n-module/issues/1075
    Vue.observable(this.$i18n.locales)
  }
}
</script>
