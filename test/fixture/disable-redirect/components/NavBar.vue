<template>
  <div class="navbar">
    <nuxt-link v-for="link in links" :key="link.label" tag="a" :to="localePath(link.path)">
      {{ link.label }}
    </nuxt-link>
  </div>
</template>

<script>
export default {
  computed: {
    links () {
      return [
        { label: 'Home', path: '/' },
        { label: 'About', path: '/about' },
        { label: 'Foo', path: '/foo' },
        { label: 'FooBar', path: '/foo/bar' }
      ]
    }
  }
}
</script>

<style>
.navbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.navbar a {
  padding: 0 10px;
}
</style>
