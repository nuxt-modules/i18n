<template>
  <ul class="lang-switcher">
    <li v-for="locale in $i18n.locales" :key="locale.code">
      <nuxt-link :to="switchLocalePath(locale.code)">
        {{ locale.code.toUpperCase() }}
      </nuxt-link>
    </li>
  </ul>
</template>

<style scoped>
.lang-switcher {
  margin: 20px;
}
</style>
