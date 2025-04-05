export default defineI18nLocale(
  () =>
    ({
      'server-key': 'Hello!'
    }) as Record<string, string> // types should be stripped during transformation
)
