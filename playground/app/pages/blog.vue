<script setup lang="ts">
defineI18nRoute({
  paths: {
    en: '/blog-us',
    fr: '/a-blog',
    ja: '/blog-ja'
  }
})

const { t, locales, baseUrl } = useI18n({
  useScope: 'local'
})
console.log('locales', locales, baseUrl)
</script>

<template>
  <div>
    <h1>{{ t('desc') }}</h1>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "desc": "This is blog page"
  },
  "fr": {
    "desc": "Ceci est la page blog"
  },
  "ja": {
    "desc": "これはブログページです"
  }
}
</i18n>
