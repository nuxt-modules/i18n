<template>
<div>
  <LangSwitcher />
  {{ $t('about') }}
  <nuxt-link exact :to="localePath('index')">{{ $t('home') }}</nuxt-link>
</div>
</template>

<script>
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  i18n: {
    paths: {
      en: '/about-us',
      fr: '/a-propos'
    }
  }
}
</script>
