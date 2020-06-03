<template>
  <div>
    <LangSwitcher />
    <h1>{{ $t('posts') }}</h1>
    <router-view />
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
      title: this.$t('posts')
    }
  },
  nuxtI18n: {
    paths: {
      fr: '/articles'
    }
  }
}
</script>
