import { resolve } from 'path'
import getPort from 'get-port'
import { setup as setupDevServer, teardown as teardownDevServer } from 'jest-dev-server'

/**
 * Creates a static web server in a separate process.
 */
class StaticServer {
  constructor (path, port, verbose) {
    this.path = path
    this.url = ''
    this.port = port || null
    this.verbose = verbose
  }

  getUrl (path) {
    return `${this.url}${path}`
  }

  async start () {
    if (!this.port) {
      this.port = await getPort()
    }

    this.url = `http://localhost:${this.port}`

    const serverPath = resolve(__dirname, 'http-server-internal.js')

    await setupDevServer({
      command: `node -r esm ${serverPath} -- ${this.path} --port ${this.port} ${this.verbose ? '--verbose' : ''}`,
      port: this.port
    })
  }

  async destroy () {
    await teardownDevServer()
  }
}

/**
 * Starts a server.
 *
 * @param {string} path
 * @param {number} [port]
 * @param {boolean} [verbose]
 *
 * @return {Promise<StaticServer>} The URL of the started server
 */
export default async function startHttpServer (path, port, verbose) {
  const server = new StaticServer(path, port, verbose)
  await server.start()
  return server
}
