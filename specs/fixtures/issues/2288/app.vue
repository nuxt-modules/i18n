<template>
  <div>
    <NuxtLayout>
      <nav>
        <nuxt-link id="root" class="link" to="/"> / </nuxt-link>
        <nuxt-link id="root-en" class="link" to="/en"> /en </nuxt-link>
        <nuxt-link id="about-en" class="link" to="/en/about"> /en/about </nuxt-link>
        <nuxt-link class="link" to="/about"> /about </nuxt-link>
        <nuxt-link class="link" to="/ar/about"> /ar/about </nuxt-link>
        <nuxt-link id="example-ar" class="link" to="/ar/example"> /ar/example </nuxt-link>
        <nuxt-link class="link" to="/en/example"> /en/example </nuxt-link>
        <nuxt-link class="link" to="/example"> /example </nuxt-link>
      </nav>

      <br />
      <br />
      <br /><br />
      <div>
        Switch language
        <button id="ar" @click="switchLanguage('ar')" style="margin-right: 10px">Arabic</button>
        <button id="en" @click="switchLanguage('en')">English</button>
      </div>

      <br /><br />
      <div>
        <strong>Current path: </strong>
        <code id="route-path">
          {{ useRoute().path }}
        </code>
      </div>

      <br />
      <div>
        <strong>Current locale: </strong>
        <code>
          {{ currentLocale }}
        </code>
      </div>

      <br /><br /><br /><br />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const { setLocale, locale } = useI18n()
const currentLocale = computed(() => locale.value)
async function switchLanguage(lang) {
  await setLocale(lang)
}
</script>

<style>
nav {
  background-color: #eee;
  padding: 10px;
}
.link {
  padding: 15px;
}
</style>
