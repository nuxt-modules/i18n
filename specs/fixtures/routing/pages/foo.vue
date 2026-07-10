<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div>
    <button id="counter" @click="count++">parent state: {{ count }}</button>
    <nav>
      <NuxtLink id="to-bar" :to="$localePath('/foo/bar')">bar</NuxtLink>
      <NuxtLink id="to-baz" :to="$localePath('/foo/baz')">baz</NuxtLink>
      <NuxtLink id="to-fr" :to="$switchLocalePath('fr')">fr</NuxtLink>
    </nav>
    <NuxtPage />
  </div>
</template>
