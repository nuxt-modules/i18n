import { resolve } from 'path'
import getPort from 'get-port'
import { setup as setupDevServer, teardown as teardownDevServer } from 'jest-dev-server'

/** @typedef {{
 *   path: string
 *   port?: number
 *   noTrailingSlashRedirect?: boolean
 *   verbose?: boolean
 * }} ServerOptions
 */

/**
 * Creates a static web server in a separate process.
 */
export class StaticServer {
  /** @param {ServerOptions} options */
  constructor (options) {
    this.path = options.path
    this.url = ''
    this.port = options.port || null
    this.noTrailingSlashRedirect = options.noTrailingSlashRedirect || false
    this.verbose = options.verbose
  }

  /** @param {string} path */
  getUrl (path) {
    return `${this.url}${path}`
  }

  async start () {
    if (!this.port) {
      this.port = await getPort()
    }

    this.url = `http://localhost:${this.port}`

    const serverPath = resolve(__dirname, 'http-server-internal.js')
    const args = [
      `node -r esm ${serverPath}`,
      '--',
      this.path,
      `--port ${this.port}`
    ]

    if (this.verbose) {
      args.push('--verbose')
    }

    if (this.noTrailingSlashRedirect) {
      args.push('--no-trailing-slash-redirect')
    }

    await setupDevServer({
      command: args.join(' '),
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
 * @param {ServerOptions} options
 *
 * @return {Promise<StaticServer>} The URL of the started server
 */
export async function startHttpServer (options) {
  const server = new StaticServer(options)
  await server.start()
  return server
}
