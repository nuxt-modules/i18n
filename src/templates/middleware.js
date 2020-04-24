import middleware from '../middleware'

middleware.nuxti18n = async (context) => {
  const { app, isHMR } = context

  if (isHMR) {
    return
  }

  await app.i18n.__onNavigate()
}
