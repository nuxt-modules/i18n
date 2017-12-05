<template>
<div>
  <LangSwitcher />
  {{ $t('about') }}
  <nuxt-link :exact="true" :to="localePath('index')">{{ $t('home') }}</nuxt-link>
</div>
</template>

<script>
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
}
</script>
