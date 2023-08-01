<template>
  <div>
    <h1>{{ $t('welcome') }}</h1>
    <p>Current locale: {{ locale }}</p>
    <ul>
      <li
        v-for="({ code, name }, i) in locales"
        :key="code"
        :class="{ selected: code === locale }"
        @click.prevent="setLocale(code)"
      >
        {{ name }}
      </li>
    </ul>
  </div>
</template>

<script setup>
const { locale, locales, setLocale } = useI18n()
</script>

<style>
/* underline style for selected locale */
.selected {
  text-decoration: underline;
}

ul {
  list-style: none;
  padding: 0;
  display: flex;
  font-size: larger;
}
li {
  margin-right: 1rem;
  cursor: pointer;
}
</style>
