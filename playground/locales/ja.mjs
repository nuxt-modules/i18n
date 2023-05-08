export default async function (locale) {
  return $fetch(`/api/${locale}`)
}
