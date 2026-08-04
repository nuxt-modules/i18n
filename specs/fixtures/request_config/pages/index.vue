<script setup lang="ts">
import { useI18n, useSwitchLocalePath } from '#i18n'

const { locale, locales, localeCodes, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div>
    <h1 id="hello">{{ t('hello') }}</h1>
    <span id="locale">{{ locale }}</span>
    <span id="locale-codes">{{ localeCodes.join(',') }}</span>
    <span id="locales-list">{{ locales.map(l => l.code).join(',') }}</span>
    <span id="path-nl">{{ switchLocalePath('nl') }}</span>
    <span id="path-fr">{{ switchLocalePath('fr') }}</span>
  </div>
</template>
