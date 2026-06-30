import pino from "pino";
import type { Env } from "../config/env.js";

export function createLogger(env: Env) {
  const options =
    env.NODE_ENV === "development"
      ? {
          level: "debug" as const,
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: true,
            },
          },
        }
      : {
          level: "info" as const,
        };

  return pino({
    ...options,
  });
}

export type Logger = ReturnType<typeof createLogger>;
