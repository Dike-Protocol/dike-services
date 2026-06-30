import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Env } from "./env.js";

const manifestSchema = z.object({
  network: z.string(),
  source: z.string(),
  admin: z.string(),
  treasury: z.string(),
  governance_authority: z.string(),
  collateral_contract: z.string(),
  asset_code: z.string(),
  usdc_issuer: z.string(),
  contracts: z.object({
    mock_usdc: z.string(),
    dike_timelock: z.string(),
    dike_governance: z.string(),
    market_registry: z.string(),
    conditional_tokens: z.string(),
    collateral_vault: z.string(),
    amm: z.string(),
    fee_manager: z.string(),
    cod_oracle: z.string(),
    council_of_dike: z.string(),
    market_factory: z.string(),
  }),
});

export type DikeManifest = z.infer<typeof manifestSchema>;
export type DikeManifestContracts = DikeManifest["contracts"];

export type LoadedManifest = {
  data: DikeManifest;
  raw: string;
  hash: string;
};

export async function loadManifest(env: Env): Promise<LoadedManifest> {
  const manifestPath = path.isAbsolute(env.DIKE_MANIFEST_PATH)
    ? env.DIKE_MANIFEST_PATH
    : path.join(process.cwd(), env.DIKE_MANIFEST_PATH);
  const raw = await readFile(manifestPath, "utf8");
  const data = manifestSchema.parse(JSON.parse(raw));

  if (data.network !== env.STELLAR_NETWORK) {
    throw new Error(
      `Manifest network "${data.network}" does not match STELLAR_NETWORK="${env.STELLAR_NETWORK}".`,
    );
  }

  return {
    data,
    raw,
    hash: createHash("sha256").update(raw).digest("hex"),
  };
}

export const MANIFEST_MODULE_MAP = {
  market_factory: "market_factory",
  market_registry: "market_registry",
  conditional_tokens: "conditional_tokens",
  collateral_vault: "collateral_vault",
  amm: "amm",
  fee_manager: "fee_manager",
  cod_oracle: "cod_oracle",
  council_of_dike: "council_of_dike",
  dike_governance: "dike_governance",
  dike_timelock: "dike_timelock",
  mock_usdc: "mock_usdc",
} as const;
