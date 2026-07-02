import { buildApp } from "./api/server.js";

function logFatalError(kind: string, error: unknown) {
  console.error(`[${kind}]`, error);
}

process.on("uncaughtException", (error) => {
  logFatalError("uncaughtException", error);
});

process.on("unhandledRejection", (reason) => {
  logFatalError("unhandledRejection", reason);
});

const app = await buildApp();

await app.listen({
  host: "0.0.0.0",
  port: app.services.env.PORT,
});
