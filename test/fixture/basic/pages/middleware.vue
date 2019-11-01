<template>
  <div>
    <div id="paths">{{ allLocalePaths }}</div>
    <div id="name">{{ routeBaseName }}</div>
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
  data () {
    return {
      allLocalePaths: [],
      routeBaseName: ''
    }
  },
  asyncData ({ app }) {
    return {
      allLocalePaths: app.allLocalePaths.join(','),
      routeBaseName: app.routeBaseName
    }
  }
}
</script>
