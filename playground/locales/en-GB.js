export default async function (context, locale) {
  return $fetch(`/api/${locale}`)
}
