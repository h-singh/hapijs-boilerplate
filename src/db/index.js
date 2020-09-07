
import MongoClient from 'mongodb';
import config from 'config';
import fs from 'fs';
import _ from 'lodash';
import logger from '../logger/logger.js';

const MONGODB_X509 = 'MONGODB-X509';

const connections = new WeakMap();
const mongodbs = new WeakMap();

const SSL_CERT = config.has('services.mongodb.sslCert') ? fs.readFileSync(config.get('services.mongodb.sslCert'), 'utf8') : null;
const SSL_KEY = config.has('services.mongodb.sslKey') ? fs.readFileSync(config.get('services.mongodb.sslKey'), 'utf8') : null;
const SSL_CA = config.has('services.mongodb.sslCA') ? fs.readFileSync(config.get('services.mongodb.sslCA'), 'utf8') : null;

export default class MongoDBClient {
  get isConnected() {
    return connections.get(this) && connections.get(this).isConnected();
  }

  get mongoDB() {
    return mongodbs.get(this);
  }

  get mongoError() {
    return this.mongoDB ? this.mongoDB.__mongoerror__ : null;
  }

  connect() {
    if (this.isConnected) {
      return Promise.resolve(true);
    }
    return Promise.resolve(true)
      .then(() => {
        const options = {
          poolSize: 10,
          connectTimeoutMS: 3 * 60 * 1000,
          socketTimeoutMS: 5 * 60 * 1000,
          autoReconnect: true,
          reconnectTries: 1000,
          reconnectInterval: 3000,
          loggerLevel: 'info',
          useNewUrlParser: true,
        };
        if (config.has('services.mongodb.authenticationMechanism') && config.get('services.mongodb.authenticationMechanism') === MONGODB_X509) {
          logger.info(`${MONGODB_X509} Auth Mechanism is enabled. Loading certificate files.`);
          options.ssl = true; // must be true when using ssl certs.
          options.sslCert = this.sslCert || SSL_CERT;
          options.sslKey = this.sslKey || SSL_KEY;
          options.sslCA = this.sslCA || SSL_CA;
          logger.info('Loaded certificate files.');
        }
        logger.info(`Connecting to mongodb at ${this.connectionURL}.`);
        return MongoClient.connect(this.connectionURL, options);
      })
      .then((dbarg) => {
        connections.set(this, dbarg);
        const db = dbarg.db();
        mongodbs.set(this, db);
        logger.info(`Connection to MongoDB at ${this.connectionURL} succeeded`);
        db.__mongoerror__ = null;

        db.on('close', () => {
          db.__mongoerror__ = null;
          logger.error('Database connection has closed will have to reconnect with next operation');
        });
        db.on('reconnect', () => {
          db.__mongoerror__ = null;
          logger.info('Database connection has been reconnected');
        });
        db.on('error', (err) => {
          db.__mongoerror__ = err;
          logger.error(`Database connection has an error ${err}`);
        });
        db.on('timeout', (err) => {
          db.__mongoerror__ = err;
          logger.error(`Database connection has a timeout ${err}`);
        });
        return db.collection('test'); // create a test collection to see connection is working.
      })
      .then((col) => {
        logger.info('Trying to find one');
        return col.findOne();
      })
      .then(() => {
        logger.info(`Test Connection to MongoDB at ${this.connectionURL} succeeded`);
      });
  }

  async init({ url, sslCA, sslCert, sslKey, }) {
    this.connectionURL = !_.isUndefined(url) ? url : config.get('services.mongodb.url');
    this.sslCA = sslCA;
    this.sslCert = sslCert;
    this.sslKey = sslKey;
    return this.connect();
  }
}
