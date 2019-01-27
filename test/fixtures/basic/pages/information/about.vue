<template>
<div>
  <LangSwitcher />
  {{ $t('about') }}
  <nuxt-link exact :to="localePath('index')">{{ $t('home') }}</nuxt-link>
</div>
</template>

<script>
import LangSwitcher from '../../components/LangSwitcher'

export default {
  components: {
    LangSwitcher
  },
  nuxtI18n: {
    paths: {
      en: '/about-us', // -> accessible at /about-us (no prefix since it's the default locale)
      fr: 'a-propos',  // -> accessible at /fr/information/a-propos
      es: '/sobre'     // -> accessible at /es/sobre
    }
  }
}
</script>
