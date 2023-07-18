<script lang="ts" setup>
const localePath = useLocalePath()
</script>
<template>
  <div>
    <button
      v-for="locale in $i18n.locales"
      :id="locale.code"
      :key="locale.code"
      @click="$i18n.setLocale(locale.code)"
    >
      {{ locale.name }}
    </button>
  </div>

  <nuxt-page />

  <p>
    Test:
    <nuxt-link id="disabled-route" :to="localePath('/disabled-localized-route')">
      Page with disabled localized route
    </nuxt-link>
  </p>
</template>

<style lang="css" scoped>
button {
  margin-right: 16px;
}
</style>
