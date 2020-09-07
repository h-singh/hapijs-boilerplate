import Hapi from "@hapi/hapi";
import logger from "./logger/logger.js";
import Exts from "./ext/exts.js";
import Events from "./events/events.js";
import init from "./routes/index.js";
import MongoDBClient from "./db/index.js";

class Server {

  server;

  init(options) {
    return Promise.resolve(true).then(() => {
      this.server = new Hapi.Server(options);
    }).then(() => {
      const exts = new Exts(this.server);
      return exts.init();
    }).then(() => {
      const events = new Events(this.server);
      return events.init();
    }).then(async () => {
      console.log('Init Process Completed .... \nRegistering routes:');
      logger.info('Init Process Completed .... \nRegistering routes:');
      await init(this.server);
    }).then(async () => {
      const mongo = new MongoDBClient()
      await mongo.init({});
      this.server.app.mongodb = mongo.mongoDB;
      this.server.app.mongoClient = mongo;
    }).then(() => {
      // add final route for readiness probe.
      this.server.route({
        handler: async () => {
          return {
            ok: true,
            ts: new Date().toISOString(),
            mongo: {isConnected: this.server.app.mongoClient.isConnected}
          };
        },
        method: "GET",
        options: {
          auth: false
        },
        path: "/ready",
      });
    });
  }

  async start() {
    console.log('Starting');
    logger.info('Starting');
    await this.server.start();
  }

  get server() {
    return this.server;
  }
}

const server = new Server();
server.init({
  host: '0.0.0.0',
  port: 9080
}).then(async () => {
  await server.start();
  server.server.table().forEach((route) => {
    console.log(`${route.method}\t${route.path}`);
    logger.info(`${route.method}\t${route.path}`);
  });
  console.log(`Server started at ${server.server.info.uri}`);
  logger.info(`Server started at ${server.server.info.uri}`);
});
