type PageMeta = {
  title: string
  description: string
  headline: string
}

export default function usePageMeta() {
  const route = useRoute()
  function setPageMeta({ title = '', description = '', headline = '' }: PageMeta) {
    useSeoMeta({ title, ogTitle: title, description, ogDescription: description })
    defineOgImageComponent(route.path.includes('/docs/v9') ? 'DocsV9' : 'Docs', { title, description, headline })
  }

  return { setPageMeta }
}
