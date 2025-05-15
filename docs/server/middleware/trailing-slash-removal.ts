export default defineEventHandler(async event => {
  // redirect to remove trailing slash
  // if (event.path.at(-1) === '/') {
  //   await sendRedirect(event, event.path.slice(0, -1), 301)
  // }
})
