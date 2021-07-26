<template>
  <Nuxt />
</template>

<script>
export default {
  head () {
    return this.$nuxtI18nHead({ addDirAttribute: false, addSeoAttributes: true })
  }
}
</script>
