// shadowed by the localized catch-all page route `ignore-routes/[...catch].vue` (#3842)
export default defineEventHandler(() => {
  return { message: 'Hello from test endpoint!' }
})
