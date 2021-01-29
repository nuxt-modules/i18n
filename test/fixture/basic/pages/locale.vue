<template>
  <div id="t">{{ $t('locale') }}</div>
</template>

<script>
export default {
  head () {
    return this.$nuxtI18nHead({ addSeoAttributes: true })
  }
}
</script>
