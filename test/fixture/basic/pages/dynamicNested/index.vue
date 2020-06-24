<template>
  <div>
    Dynamic nested example
  </div>
</template>

<script>
export default {
  nuxtI18n: {
    paths: {
      fr: '/imbrication-dynamique'
    }
  },
  head () {
    return {
      title: this.$t('dynamic')
    }
  }
}
</script>
