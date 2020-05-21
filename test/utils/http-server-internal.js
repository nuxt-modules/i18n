import http from 'http'
import { ArgumentParser } from 'argparse'
import serveStatic from 'serve-static'
import finalhandler from 'finalhandler'

/**
 * Starts a server.
 *
 * @param {string} path
 * @param {number} port
 * @param {boolean} verbose
 *
 * @return {import('http').Server}
 */
function startServer (path, port, verbose) {
  const host = 'localhost'

  const serve = serveStatic(path)

  const server = http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res))
  })

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

parser.addArgument('path', {
  type: 'string',
  help: 'The path to start server in'
})

parser.addArgument(['-p', '--port'], {
  type: 'int',
  defaultValue: 3000,
  help: 'Port to run on (default: 3000)'
})

parser.addArgument(['-v', '--verbose'], {
  action: 'storeTrue',
  defaultValue: false,
  help: 'Enable verbose logging'
})

const args = parser.parseArgs()

let server = startServer(args.path, args.port, args.verbose)

process.on('SIGTERM', () => {
  server.close()
  server = null
})
