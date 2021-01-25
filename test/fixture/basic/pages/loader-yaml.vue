<template>
  <div>
    <p id="title">{{ $t('hello') }}</p>
    <p id="locales">{{ locales }}</p>
    <p id="localeProperties">{{ JSON.stringify(localeProperties) }}</p>
  </div>
</template>

<script>
export default {
  computed: {
    locales () {
      return this.$i18n.locales || []
    },
    localeProperties () {
      return this.$i18n.localeProperties || {}
    }
  }
}
</script>

<i18n lang="yaml">
en:
  hello: "hello world!"
fr:
  hello: "Bonjour le monde!"
</i18n>
