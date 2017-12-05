<template>
<div>
  <LangSwitcher />
  {{ $t('home') }}
  <nuxt-link :exact="true" :to="localePath('about')">{{ $t('about') }}</nuxt-link>
</div>
</template>

<script>
import LangSwitcher from '../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  mounted () {
    console.log(this)
  }
}
</script>
