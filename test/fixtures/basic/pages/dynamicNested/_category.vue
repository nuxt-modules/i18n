<template>
  <div>
    Category {{ $route.params.category }}
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
