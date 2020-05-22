<template>
  <div>
    <h2>{{ $route.params.slug }}</h2>
    <nuxt-link id="post-link" exact :to="localePath('posts')">index</nuxt-link>
    <p>
      <nuxt-link
        id="post-link-no-route"
        exact
        :to="localePath({
          params: {
            slug: 'look-ma-no-route'
          }
        })">no route slug (same locale)</nuxt-link>
    </p>
    <p>
      <nuxt-link
        id="post-link-no-route-fr"
        exact
        :to="localePath({
          params: {
            slug: 'look-ma-no-route'
          }
        }, 'fr')">no route slug (fr locale)</nuxt-link>
    </p>
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
