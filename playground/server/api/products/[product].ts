import productsData from '../products-data'

export default defineEventHandler(async event => {
  const slug = event.context.params?.product
  const found = productsData.find(x => Object.values(x.slugs).includes(slug))

  // await new Promise(resolve => setTimeout(resolve, 600))

  if (found == null) {
    return {}
  }

  return found
})
