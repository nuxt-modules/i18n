<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
:root {
  font-family: Arial, Helvetica, sans-serif;
}

html {
  padding: 0.5em;
}

.my-enter-active,
.my-leave-active {
  transition: opacity 0.3s;
}

.my-enter,
.my-leave-active {
  opacity: 0;
}
</style>
