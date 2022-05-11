<template>
  <ul class="lang-switcher">
    <li v-for="locale in $i18n.locales" :key="locale.code">
      <nuxt-link :to="switchLocalePath(locale.code, forcePrefix)">
        {{ locale.code.toUpperCase() }}
      </nuxt-link>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    forcePrefix: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.lang-switcher {
  margin: 20px;
}
</style>
