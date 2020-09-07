import winston from "winston";
import * as wdrf from "winston-daily-rotate-file";
import config from "config";

const fileFormat = winston.format.combine(
  winston.format.label({ label: "scheduler-api" }),
  winston.format.timestamp(),
  winston.format.metadata({ fillExcept: ["message", "level", "timestamp", "label"] }),
  winston.format.colorize(),
  winston.format.printf((info) => {
    info.metadata.traceId = info.metadata.traceId || "";
    info.metadata.route = info.metadata.route || "";
    info.metadata.userId = info.metadata.userId || "";
    let msg = "";
    let isJSON = false;
    try {
      msg = JSON.stringify(info.message);
      isJSON = true;
    } catch {
      msg = info.message;
    }
    let out = `{"lbl": "${info.label}", "ts": "${info.timestamp}", "lvl":"${info.level}", "route":"${info.metadata.route}", "uId": "${info.metadata.userId}", "tId": "${info.metadata.traceId}", "msg": ${ isJSON ? msg : '"' + msg + '"' } }`;
    return out;
  })
);

const logger = winston.createLogger({
  level: config.logs.level,
  transports: [
    new (winston.transports.DailyRotateFile)({
      datePattern: "YYYY-MM-DD-HH",
      filename: `${config.logs.path}/api-server-%DATE%.log`,
      format: fileFormat,
      level: config.logs.level,
      maxFiles: "365d",
      maxSize: "10m",
    })
  ]
});

export default logger;
