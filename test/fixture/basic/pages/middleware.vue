<template>
  <div>
    <div id="paths">{{ allLocalePaths }}</div>
    <div id="name">{{ routeBaseName }}</div>
    <div id="localizedRoute">{{ localizedRoute }}</div>
  </div>
</template>

<script>
export default {
  middleware: ['i18n-middleware'],
  nuxtI18n: {
    paths: {
      en: '/middleware',
      fr: '/middleware-fr'
    }
  },
  asyncData ({ app }) {
    return {
      allLocalePaths: app.allLocalePaths.join(','),
      routeBaseName: app.routeBaseName,
      localizedRoute: app.localizedRoute
    }
  },
  data () {
    return {
      allLocalePaths: [],
      routeBaseName: '',
      localizedRoute: {}
    }
  }
}
</script>
