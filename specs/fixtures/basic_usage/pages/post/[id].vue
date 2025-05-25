<script setup lang="ts">
const route = useRoute()

const setI18nParams = useSetI18nParams()
setI18nParams({
  en: { id: 'my-post' },
  fr: { id: 'mon-article' }
})
</script>

<template>
  <div>
    <code id="post-id">{{ route.params.id }}</code>
    <LangSwitcher />
  </div>
</template>
