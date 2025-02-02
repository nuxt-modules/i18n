<template>
  <div>
    {{ $t('welcome') }}
  </div>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const head = useLocaleHead()

useHead(() => ({
  htmlAttrs: head.value.htmlAttrs
}))

const availableLocales = computed(() => {
  return (locales.value as LocaleObject[])
    .filter(item => {
      return item.code !== locale.value
    })
    .map(item => {
      return {
        label: item.name,
        key: item.code
      }
    })
})

const currentLocale = computed(() => {
  return (locales.value as LocaleObject[]).filter(item => {
    return item.code === locale.value
  })
})

function changeLocal(code: any) {
  setLocale(code)
}
</script>
