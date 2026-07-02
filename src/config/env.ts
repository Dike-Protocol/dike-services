import "dotenv/config";
import { z } from "zod";
import { NETWORK_PASSPHRASES, type StellarNetworkName } from "./networks.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  STELLAR_NETWORK: z.enum(["mainnet", "testnet", "local"]).default("testnet"),
  STELLAR_RPC_URL: z.url(),
  STELLAR_HORIZON_URL: z.url(),
  STELLAR_NETWORK_PASSPHRASE: z.string().min(1),
  DIKE_CONTRACTS_ROOT: z.string().min(1).default(process.cwd()),
  DIKE_MANIFEST_PATH: z.string().min(1).default("./deployments/testnet.json"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  ADMIN_API_KEY: z.string().min(1).optional(),
  INDEXER_START_LEDGER: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .pipe(z.number().int().positive().optional()),
  INDEXER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5_000),
  INDEXER_LEDGER_WINDOW: z.coerce.number().int().positive().default(250),
  RECONCILIATION_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
  INDEXER_LAG_ALERT_THRESHOLD: z.coerce.number().int().positive().default(50),
  REORG_SAFETY_MARGIN_LEDGERS: z.coerce.number().int().min(0).default(10),
});

export type Env = z.infer<typeof envSchema> & {
  STELLAR_NETWORK: StellarNetworkName;
};

export function loadEnv(): Env {
  const env = envSchema.parse(process.env);
  const expectedPassphrase = NETWORK_PASSPHRASES[env.STELLAR_NETWORK];

  if (env.STELLAR_NETWORK_PASSPHRASE !== expectedPassphrase) {
    throw new Error(
      `Passphrase mismatch for ${env.STELLAR_NETWORK}. Expected "${expectedPassphrase}".`,
    );
  }

  return env as Env;
}
