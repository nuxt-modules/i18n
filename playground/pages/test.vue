<script setup>
import { useNuxtApp } from 'nuxt/app'
import { onMounted } from 'vue'

const { d: $d } = useI18n()
console.log($t('hello'))
// console.log(useNuxtApp().$t('hello'))
const myText = computed(() => $t('hello'))

console.log($te('test'))
onMounted(() => {
  console.log($t('hello'))
  console.log($d('2024-01-01'))
  console.log($n(1234))
})
// export default defineComponent({
//   setup() {
//     const { t: $t } = useI18n()
//     return { $t }
//   }
// })
</script>

<template>
  <div>
    <LangSwitcher />
    <div>Test page, open console {{ myText }}</div>
  </div>
</template>
