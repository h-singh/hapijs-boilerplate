import { v4 as uuid } from "uuid";
import logger from "../logger/logger.js";

export default class Exts {
  constructor(server) {
    this.server = server;
  }

  init() {
    return Promise.resolve(true).then(() => {
      // 1. https://hapi.dev/api/?v=20.0.0#request-lifecycle
      this.server.ext("onRequest", (request, h) => {
        const userId = request.auth.isAuthenticated ? request.auth.credentials.user.userId : "null";
        // start a traceId for a request once it enters the framework.
        const traceId = uuid();
        const route = request.path;
        const requestLogger = logger.child({ userId, traceId, route });
        request.app.logger = requestLogger;
        request.app.traceId = traceId;
        return h.continue;
      });
    })/*.then(() => {
      //2.
      this.server.ext("onPreAuth", (request, h) => {
      });
    }).then(() => {
      //3.
      this.server.ext("onCredentials", (request, h) => {
      });
    }).then(() => {
      //4.
      this.server.ext("onPostAuth", (request, h) => {
      });
    })*/.then(() => {
      //5.
      this.server.ext("onPreResponse", (request, h) => {
        // Format error responses here e.g. sending a id with error for easy debugging.
        if(request.response && request.response.isBoom) {
          const eres = { ...request.response.output.payload, trackingId: request.app.traceId };
          const boom = request.response;
          return h.response(eres).code(boom.output.statusCode).message(request.response.message);
        }
        return h.continue;
      });
    });
  }
}
