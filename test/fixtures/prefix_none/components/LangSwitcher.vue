<template>
  <div>
    <nuxt-link
      v-for="(locale, index) in $i18n.locales"
      v-if="locale.code !== $i18n.locale"
      :key="index"
      :exact="true"
      :to="`/${locale.code}${switchLocalePath(locale.code)}`"
      @click="$i18n.switchLocale(locale.code)">{{ locale.name }}</nuxt-link>
      <!-- @click.prevent="$i18n.switchLocale(locale.code)" -->
  </div>
</template>

<script>
export default {
  name: 'LangSwitcher'
}
</script>
