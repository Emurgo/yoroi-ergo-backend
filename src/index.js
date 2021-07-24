// @flow
const restify = require('restify');
const config = require('config');
const bunyan = require('bunyan');
const corsMiddleware = require('restify-cors-middleware');
const JSONBigInt = require('json-bigint');
const api = require('./api');
import type { HandlerDefinitions } from './types/utils';

const logger = bunyan.createLogger({
  name: 'yoroi-ergo-backend',
  level: config.logLevel,
});

const server = restify.createServer({ log: logger });

const cors = corsMiddleware({
  origins: config.server.corsOrigins,
  allowHeaders: config.server.corsAllowHeaders,
  exposeHeaders: config.server.corsExposeHeaders,
});
server.pre(cors.preflight);
server.use(cors.actual);

server.use(restify.plugins.requestLogger());
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.on('after', (req, res, _route, _error) => {
  req.log.info(`${req.method} ${req.url} ${res.statusCode}`);
});

installHandlers(api.handlers);
 
server.listen(config.server.port, () => {
  logger.info('%s listening at %s', server.name, server.url);
});
 
function installHandlers(handlers: HandlerDefinitions) {
  for (const { method, url, handler } of handlers) {
    server[method](url, async (req, res, next) => {
      try {
        const { status, body } = await handler(req, res);
        // The handler indicates that it doesn't respond with a JSON object by
        // return int status === 0.
        if (status !== 0) {
          res.status(status);
          if (status === 200) {
            res.header('content-type', 'application/json');
            res.sendRaw(JSONBigInt.stringify(body));
          } else {
            res.json(body);
          }
        }
      } catch (error) {
        req.log.error('handler error', error);
        res.status(500);
        res.json({ error: error.message });
      }
      next();
    });
  }
}

