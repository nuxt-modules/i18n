<template>
  <div>
    <h3>Switch language:</h3>

    <button
      v-for="locale in availableLocales"
      :id="locale.code"
      :key="locale.code"
      @click="async () => await $i18n.setLocale(locale.code)"
    >
      {{ locale.name }}
    </button>

    <hr>

    <h3>Current language:</h3>
    <p>
      <img
        id="flag"
        :key="currentLocale.flag"
        :src="`/flags/${currentLocale.flag}.svg`"
        :alt="currentLocale.flag"
      >

      <img
        v-if="isMounted"
        id="flag-mounted"
        :key="currentLocale.flag"
        :src="`/flags/${currentLocale.flag}.svg`"
        :alt="currentLocale.flag"
      >

      <span>{{ currentLocale.name }}</span>
    </p>

    <hr>

    <h3>Translation test</h3>
    <p
      id="html-msg"
      :key="currentLocale"
      v-html="$t('test')"
    />
    <p
      v-if="isMounted"
      id="html-msg-mounted"
      v-html="$t('test')"
    />
    <p id="test-msg">
      {{ $t('test') }}
    </p>
  </div>
</template>

<script lang="ts" setup>
const i18n = useI18n()
const availableLocales = computed(() => i18n.locales.value)
const currentLocale = computed(() => availableLocales.value.find(({ code }) => code === i18n.locale.value))
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})
</script>

<style lang="css" scoped>
button,
img {
  margin-right: 16px;
}
</style>
