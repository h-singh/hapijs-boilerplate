import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from "../logger/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ls = function (dir, ext) {
  let results = [];
  fs.readdirSync(dir).forEach(function (file) {
    var stat = fs.statSync(dir + '/' + file);
    if (stat && stat.isDirectory()) {
      results = results.concat(ls(dir + '/' + file, ext));
    } else if (file.endsWith(ext)) {
      results.push(dir.split(__dirname)[1] + '/' + file);
    }
  });
  return results;
};

const init = async function (server) {
  return Promise.resolve(true).then(() => {
    console.log("Finding Routes:");
    logger.info("Finding Routes:");
    return ls(__dirname, '.js')
      .filter((file) => {
        //ignore immediate index file under routes only (this script).
        return file !== '/index.js';
      })
  }).then(async (routes)=> {
    for(let file of routes) {
      console.log("Importing", file);
      logger.info("Importing", file);
      const _class = await import("." + file);
      const o = new _class.default(server);
      console.log("Initializing route");
      logger.info("Initializing route");
      await o.init();
    }
    console.log("Imported.");
    logger.info("Imported.");
  }).catch((e) => {
    console.error("Failed to import", e);
    logger.error("Failed to import", e);
    throw e;
  });
};

export default init;