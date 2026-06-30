import { buildApp } from "./api/server.js";

const app = await buildApp();

await app.listen({
  host: "0.0.0.0",
  port: app.services.env.PORT,
});
