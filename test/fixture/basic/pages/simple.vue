<template>
  <div id="container">{{ $t('home') }}</div>
</template>

<script>
export default {
  nuxtI18n: {
    locales: ['en', 'fr', 'es']  // locale not defined in global options
  }
}
</script>
