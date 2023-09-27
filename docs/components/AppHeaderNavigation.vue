<script setup lang="ts">
/**
 * See: https://github.com/nuxt-themes/docus/issues/938
 * Copied from: https://github.com/nuxt-themes/docus/blob/main/components/app/AppHeaderNavigation.vue
 */

const route = useRoute()
const { navBottomLink } = useContentHelpers()
const { navigation } = useContent()
const { config } = useDocus()

const isV7 = computed(() => route.path.startsWith('/v7'))
const hasNavigation = computed(() => !!config.value.aside?.level)

const filtered = computed(() => [...(config.value.header?.exclude || [])])

const dynamicNavigation = computed(() => {
  if (isV7.value) return [{ title: 'Switch to v8 Docs', _path: '/' }]
  return navigation.value
})

const tree = computed(() => {
  return (dynamicNavigation.value || []).filter((item: any) => {
    if (filtered.value.includes(item._path as never)) {
      return false
    }
    return true
  })
})

const isActive = (link: any) => (link.exact ? route.fullPath === link._path : route.fullPath.startsWith(link._path))
</script>

<template>
  <nav v-if="hasNavigation">
    <ul>
      <li v-for="link in tree" :key="link._path">
        <NuxtLink
          class="link"
          :to="link.redirect ? link.redirect : navBottomLink(link)"
          :class="{ active: isActive(link) }"
        >
          <Icon v-if="link.icon && config?.header?.showLinkIcon" :name="link.icon" />
          {{ link.title }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped lang="ts">
css({
  nav: {
    display: 'none',
    '@lg': {
      display: 'block'
    },
    ul: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: '1',
      maxWidth: '100%',
      truncate: true,

      '& > * + *': {
        marginLeft: '{space.2}'
      },

      li: {
        display: 'inline-flex',
        gap: '{space.1}'
      },

      '.link': {
        display: 'flex',
        alignItems: 'center',
        gap: '{space.2}',
        padding: '{space.2} {space.4}',
        fontSize: '{fontSize.sm}',
        borderRadius: '{radii.md}',
        outline: 'none',
        transition: 'background 200ms ease',

        svg: {
          display: 'inline-block'
        },

        '&:active,&.active,&:hover': {
          backgroundColor: '{color.gray.100}',
          '@dark': {
            backgroundColor: '{color.gray.900}'
          }
        },

        '&.active': {
          boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
          fontWeight: '{fontWeight.semibold}'
        }
      }
    }
  }
})
</style>
