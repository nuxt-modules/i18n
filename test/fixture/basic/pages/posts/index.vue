<template>
<div>
  <nuxt-link
    exact
    :to="localePath({
      name: 'posts-slug',
      params: {
        slug: params[$i18n.locale].slug
      }
    })">{{ params[$i18n.locale].slug }}</nuxt-link>
</div>
</template>

<script>
export default {
  async asyncData () {
    return {
      params: {
        en: { slug: 'my-post' },
        fr: { slug: 'mon-article' }
      }
    }
  }
}
</script>
