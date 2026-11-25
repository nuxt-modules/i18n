<script setup lang="ts">
// async setup keeps the page being left mounted until this one resolves
await Promise.resolve()
</script>

<template>
  <div>
    <div id="async-setup">async setup</div>
  </div>
</template>
