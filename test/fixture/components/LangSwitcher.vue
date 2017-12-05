<template>
  <div>
    <nuxt-link
      v-for="(locale, index) in $i18n.locales"
      v-if="locale.code !== $i18n.locale"
      :key="index"
      :exact="true"
      :to="switchLocalePath(locale.code)">{{ locale.name }}</nuxt-link>
  </div>
</template>

<script>
export default {
  name: 'LangSwitcher'
}
</script>
