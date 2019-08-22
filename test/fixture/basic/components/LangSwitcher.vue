<template>
  <div>
    <nuxt-link
      v-for="(locale, index) in localesExcludingCurrent"
      :key="index"
      :exact="true"
      :to="switchLocalePath(locale.code)">{{ locale.name }}</nuxt-link>
  </div>
</template>

<script>
export default {
  name: 'LangSwitcher',
  computed: {
    localesExcludingCurrent() {
      return this.$i18n.locales.filter(locale => locale.code !== this.$i18n.locale)
    }
  }
}
</script>
