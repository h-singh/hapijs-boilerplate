
export default class Test {

  server;

  constructor(server) {
    this.server = server;
  }

  init() {
    return Promise.resolve(true).then(() => {
      this.server.route({
        handler: async () => {
          return {
            ok: true,
            ts: new Date().toISOString()
          };
        },
        method: "GET",
        options: {
          auth: false
        },
        path: "/test"
      })
    });
  }
}
