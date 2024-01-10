import { resolve } from 'path'
import getPort from 'get-port'
import { joinURL } from 'ufo'
import { setup as setupDevServer, teardown as teardownDevServer } from 'jest-dev-server'

/** @typedef {{
 *   path: string
 *   port?: number
 *   base?: string
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
    this.base = options.base || '/'
    this.path = options.path
    this.url = ''
    this.port = options.port || null
    this.noTrailingSlashRedirect = options.noTrailingSlashRedirect || false
    this.verbose = options.verbose
    this.processes = null
  }

  /** @param {string} path */
  getUrl (path) {
    return joinURL(this.url, path)
  }

  async start () {
    if (!this.port) {
      this.port = await getPort()
    }

    this.url = `http://localhost:${this.port}${this.base}`

    const serverPath = resolve(__dirname, 'http-server-internal.mjs')
    const args = ['node', serverPath, this.path, `--port ${this.port}`, `--base ${this.base}`]

    if (this.verbose) {
      args.push('--verbose')
    }

    if (this.noTrailingSlashRedirect) {
      args.push('--no-trailing-slash-redirect')
    }

    console.error('start()')
    this.processes = await setupDevServer({
      command: args.join(' '),
      debug: true,
      port: this.port
    })
  }

  async destroy () {
    console.error('destroy()', this.processes)
    if (this.processes) {
      await teardownDevServer(this.processes)
      console.error('destroy()-ed')
      this.processes = null
    }
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
