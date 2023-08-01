<script setup lang="ts">
const { locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div>
    <section id="vue-i18n-usage">
      <form>
        <select v-model="locale">
          <option value="en">en</option>
          <option value="fr">fr</option>
        </select>
        <p>{{ $t('welcome') }}</p>
      </form>
    </section>
    <section id="locale-path-usages">
      <h3>localePath</h3>
      <ul>
        <li class="name">
          <NuxtLink :to="localePath('index')">{{ $t('home') }}</NuxtLink>
        </li>
        <li class="path">
          <NuxtLink :to="localePath('/')">{{ $t('home') }}</NuxtLink>
        </li>
        <li class="named-with-locale">
          <NuxtLink :to="localePath('index', 'fr')">Homepage in French</NuxtLink>
        </li>
      </ul>
    </section>
    <section id="switch-locale-path-usages">
      <h3>switchLocalePath</h3>
      <ul>
        <li class="switch-to-en">
          <NuxtLink :to="switchLocalePath('en')">English</NuxtLink>
        </li>
        <li class="switch-to-fr">
          <NuxtLink :to="switchLocalePath('fr')">Français</NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
