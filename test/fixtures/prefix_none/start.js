process.env.PORT = process.env.PORT || 5060
process.env.NODE_ENV = 'production'

const { Nuxt, Builder } = require('nuxt')
const config = require('./nuxt.config')

async function start() {
  const nuxt = new Nuxt(config)
  await new Builder(nuxt).build()
  await nuxt.listen(process.env.PORT)
  console.log(`http://localhost:${process.env.PORT}`)
}

start()
