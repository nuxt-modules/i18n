<template>
<div>
  <LangSwitcher />
  page: {{ $t('home') }}
  <nuxt-link exact :to="localePath('about')">{{ $t('about') }}</nuxt-link>
  <div>locale: {{ $i18n.locale }}</div>
</div>
</template>

<script>
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  }
}
</script>
