<template>
  <div>
    <h2>{{ $route.params.slug }}</h2>
    <nuxt-link exact :to="localePath('posts')">index</nuxt-link>
  </div>
</template>

<script>
export default {
  async asyncData ({ store }) {
    await store.dispatch('i18n/setRouteParams', {
      en: { slug: 'my-post' },
      fr: { slug: 'mon-article' }
    })
    return {}
  }
}
</script>
