<template>
  <div>
    Category {{ $route.params.category }}
    <nuxt-child></nuxt-child>
  </div>
</template>

<script>
export default {
  i18n: {
    paths: {
      fr: '/imbrication-dynamique/:category'
    }
  }
}
</script>
