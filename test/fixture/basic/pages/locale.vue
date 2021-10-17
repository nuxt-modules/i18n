<template>
  <div id="t">{{ $t('locale') }}</div>
</template>

<script>
export default {
  head () {
    return this.$nuxtI18nHead({ addDirAttribute: true, addSeoAttributes: { canonicalQueries: ['foo'] } })
  }
}
</script>
