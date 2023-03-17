import { defineEventHandler, readBody, setResponseHeader } from 'h3'
import { generateJSON } from '@intlify/bundle-utils'

export default defineEventHandler(async event => {
  const data = await readBody(event)
  const { code } = generateJSON(JSON.stringify(data), {
    env: process.dev ? 'development' : 'production'
  })
  await setResponseHeader(event, 'content-type', 'text/javascript')
  return code
})
