<script setup lang="ts">
import LangSwitcher from '../components/LangSwitcher.vue'

const route = useRoute()

const setI18nParams = useSetI18nParams()
setI18nParams({
  en: { pathMatch: ['my-post', 'abc'] },
  fr: { pathMatch: ['mon-article', 'xyz'] }
})
</script>

<template>
  <div>
    <code id="catch-all-id">{{ route.params.pathMatch.join('/') }}</code>
    <LangSwitcher />
  </div>
</template>
