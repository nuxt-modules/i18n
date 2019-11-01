<template>
  <div>
    <h1>Category {{ $route.params.category }}</h1>
    <nuxt-child></nuxt-child>
  </div>
</template>

<script>
export default {
  nuxtI18n: {
    paths: {
      fr: '/imbrication-dynamique/:category'
    }
  }
}
</script>
