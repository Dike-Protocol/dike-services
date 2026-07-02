declare module "@fastify/rate-limit" {
  import type { FastifyPluginCallback } from "fastify";

  type RateLimitPlugin = FastifyPluginCallback<{
    global?: boolean;
    max?: number;
    timeWindow?: string | number;
  }>;

  const rateLimit: RateLimitPlugin;
  export default rateLimit;
}
