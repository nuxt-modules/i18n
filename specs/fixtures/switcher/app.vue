<template>
  <div>
    <NuxtPage id="foo" />
  </div>
</template>

<style>
section {
  margin: 1rem 0;
}
.page-enter-active,
.page-leave-active {
  transition: opacity 1s;
}
.page-enter,
.page-leave-active {
  opacity: 0;
}
</style>
