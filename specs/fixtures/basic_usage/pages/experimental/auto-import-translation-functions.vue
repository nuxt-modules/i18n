<script setup lang="ts">
console.log(`[autoDeclare][default]: ${$t('welcome')}`)
console.log(`[autoDeclare][fr]: ${$t('welcome', 1, { locale: 'fr' })}`)
</script>

<template>
  <div>See console logs if experimental feature has logged without error</div>
</template>
