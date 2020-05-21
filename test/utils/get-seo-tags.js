export default function getSeoTags (dom) {
  const head = dom.querySelector('head')
  expect(head).not.toBeNull()
  // Convert children meta elements to an array.
  const metas = []
  for (const element of head.children) {
    const tagName = element.tagName.toLowerCase()

    if (!['meta', 'link'].includes(tagName)) {
      continue
    }

    const meta = { tagName }

    for (const attr of ['property', 'content', 'rel', 'rel', 'href', 'hreflang']) {
      const attrValue = element.getAttribute(attr)
      if (attrValue !== null) {
        meta[attr] = attrValue
      }
    }

    metas.push(meta)
  }

  return metas
}
