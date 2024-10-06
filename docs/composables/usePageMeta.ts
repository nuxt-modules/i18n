type PageMeta = {
  title: string
  description: string
  headline: string
}

export default function usePageMeta() {
  const route = useRoute()
  function setPageMeta({ title = '', description = '', headline = '' }: PageMeta) {
    useSeoMeta({ title, ogTitle: title, description, ogDescription: description })
    defineOgImageComponent(/\/docs\/v[7-8]/.test(route.path) ? 'Docs' : 'DocsV9', { title, description, headline })
  }

  return { setPageMeta }
}
