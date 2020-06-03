import middleware from '../middleware'

/** @type {import('@nuxt/types').Middleware} */
middleware.nuxti18n = async (context) => {
  const { app, isHMR } = context

  if (isHMR) {
    return
  }

  const [status, redirectPath] = await app.i18n.__onNavigate(context.route)
  if (status && redirectPath) {
    context.redirect(status, redirectPath)
  }
}
