import pino from "pino";
import { env } from "../../config/env.js";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "gestao-afastados-backend" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "*.token",
      "*.secret",
      "*.password",
    ],
    censor: "[REDACTED]",
  },
});
