<script lang="ts" setup>
import { useSwitchLocalePath } from '#i18n'

const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div>
    <section id="switch-locale-path">
      <span class="en">{{ switchLocalePath('en') }}</span>
      <span class="ja">{{ switchLocalePath('ja') }}</span>
      <span class="undefined">{{ switchLocalePath('undefined') }}</span>
    </section>
    <slot />
  </div>
</template>
