import fs from 'fs'
import { resolve } from 'path'
import { ArgumentParser } from 'argparse'
import express from 'express'
import serveStatic from 'serve-static'

console.error('IMPORT SERVER')

/**
 * Starts a server.
 *
 * @param {string} path
 * @param {number} port
 * @param {string} base
 * @param {boolean} noTrailingSlashRedirect
 * @param {boolean} verbose
 */
function startServer (path, port, base, noTrailingSlashRedirect, verbose) {
  const app = express()

  // @ts-ignore
  app.use(base, serveStatic(path, { redirect: !noTrailingSlashRedirect, extensions: ['html'] }))
  app.use((req, res, next) => {
    if (req.method === 'GET') {
      // When requesting /fr and both /fr/ (without index.html) and /fr.html exist, fallback to fr.html.
      fs.readFile(`${resolve(path)}${req.url}.html`, function (error, buffer) {
        if (error) {
          next()
          return
        }

        res.setHeader('Content-Type', 'text/html; charset=UTF-8')
        res.end(buffer)
      })
    } else {
      next()
    }
  })

  app.on('error', error => console.error(error))

  const host = 'localhost'
  return app.listen(port, host, () => {
    if (verbose) {
      // eslint-disable-next-line no-console
      console.info(`Static server started on http://${host}:${port}`)
    }
  })
}

const parser = new ArgumentParser()

parser.add_argument('path', {
  type: 'str',
  help: 'The path to start server in'
})

parser.add_argument('-p', '--port', {
  type: 'int',
  default: 3000,
  help: 'Port to run on (default: 3000)'
})

parser.add_argument('--base', {
  type: 'str',
  default: '/',
  help: 'The base path to expose the files at'
})

parser.add_argument('--no-trailing-slash-redirect', {
  action: 'store_true',
  default: false,
  help: 'Disables redirection to path with trailing slash for directory requests'
})

parser.add_argument('-v', '--verbose', {
  action: 'store_true',
  default: false,
  help: 'Enable verbose logging'
})

const args = parser.parse_args()

/** @type {import('http').Server | null} */
let server = startServer(args.path, args.port, args.base, args.no_trailing_slash_redirect, args.verbose)

process.on('SIGTERM', () => {
  if (server) {
    server.close()
    server = null
  }
})
