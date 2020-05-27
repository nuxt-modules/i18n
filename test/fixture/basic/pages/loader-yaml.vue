<template>
  <div>
    <p id="title">{{ $t('hello') }}</p>
    <p id="locales">{{ locales }}</p>
  </div>
</template>

<script>
export default {
  computed: {
    locales () {
      return this.$i18n.locales || []
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
