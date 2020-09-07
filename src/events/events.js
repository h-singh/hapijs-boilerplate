import logger from '../logger/logger.js';
import _ from 'lodash';

export default class Events {
  constructor(server) {
    this.server = server;
  }

  init() {
    return Promise.resolve(true).then(() => {
      this.server.events.on('request', (req, event, tags) => {
        console.log(tags);
        if (event.error) {
          req.app.logger.error(`Request:: ${req.path} Error Message: ${event.error.message}, Stack: ${JSON.stringify(event.error.stack)}`)
        } else {
          req.app.logger.debug(`Request:: ${req.path} ${event.data}`);
        }
      });

      this.server.events.on('start', () => {
        logger.info('Server started ... ');
        console.info('Server started ... ');
      });

      this.server.events.on('stop', () => {
        logger.info('Server stopped ... ');
        console.info('Server started ... ');
      });

      this.server.events.on('route', (route) => {
        logger.info(`Route to handle: ${route.method}\t${route.path}`);
      });

      this.server.events.on('response', (req) => {
        if (_.has(req, 'response._payload._data')) {
          req.app.logger.debug(`Response:: ${req.path} returns ${_.get(req, 'response._payload._data')}`);
        }
      });
    });
  }
}
