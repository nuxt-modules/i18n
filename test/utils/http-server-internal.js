import fs from 'fs'
import http from 'http'
import { resolve } from 'path'
import { ArgumentParser } from 'argparse'
import serveStatic from 'serve-static'
import finalhandler from 'finalhandler'

/**
 * Starts a server.
 *
 * @param {string} path
 * @param {number} port
 * @param {boolean} noTrailingSlashRedirect
 * @param {boolean} verbose
 *
 * @return {import('http').Server}
 */
function startServer (path, port, noTrailingSlashRedirect, verbose) {
  const serve = serveStatic(path, { redirect: !noTrailingSlashRedirect, extensions: ['html'] })
  const server = http.createServer((req, res) => {
    const done = finalhandler(req, res)

    const next = () => {
      if (req.method === 'GET') {
        // When requesting /fr and both /fr/ (without index.html) and /fr.html exist, fallback to fr.html.
        fs.readFile(`${resolve(path)}${req.url}.html`, function (error, buffer) {
          if (error) {
            done(false)
            return
          }

          res.setHeader('Content-Type', 'text/html; charset=UTF-8')
          res.end(buffer)
        })
      } else {
        done(false)
      }
    }

    // @ts-ignore
    serve(req, res, next)
  })

  const host = 'localhost'
  server.on('error', error => console.error(error))
  server.listen(port, host, () => {
    if (verbose) {
      // eslint-disable-next-line no-console
      console.info(`Static server started on http://${host}:${port}`)
    }
  })

  return server
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
let server = startServer(args.path, args.port, args.no_trailing_slash_redirect, args.verbose)

process.on('SIGTERM', () => {
  if (server) {
    server.close()
    server = null
  }
})
