<template>
  <div>
    <strong>Using nuxt-link</strong>:
    <div id="lang-switcher">
      <nuxt-link
        v-for="(locale, index) in localesExcludingCurrent"
        :key="index"
        :exact="true"
        :to="switchLocalePath(locale.code)">{{ locale.name }}</nuxt-link>
    </div>
    <strong>Using setLocale()</strong>:
    <div>
      <a
        v-for="(locale, index) in localesExcludingCurrent"
        :id="`set-locale-link-${locale.code}`"
        :key="`b-${index}`"
        href="#"
        @click.prevent="$i18n.setLocale(locale.code)">{{ locale.name }}</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LangSwitcher',
  computed: {
    localesExcludingCurrent () {
      return this.$i18n.locales.filter(locale => locale.code !== this.$i18n.locale)
    }
  }
}
</script>
