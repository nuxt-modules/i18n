<template>
  <div>
    <NuxtLayout>
      <nuxt-link id="root" class="link" to="/"> / </nuxt-link>
      <nuxt-link id="root-en" class="link" to="/en"> /en </nuxt-link>

      <nuxt-link id="about-en" class="link" to="/en/about"> /en/about </nuxt-link>
      <nuxt-link id="about" class="link" to="/about"> /about </nuxt-link>
      <nuxt-link id="about-ar" class="link" to="/ar/about"> /ar/about </nuxt-link>
      <nuxt-link id="example-ar" class="link" to="/ar/example"> /ar/example </nuxt-link>

      <br />
      <br />

      <code id="route-path">{{ useRoute().path }}</code>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
.link {
  padding: 15px;
}
</style>
