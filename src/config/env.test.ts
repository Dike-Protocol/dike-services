import { afterEach, describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

const previousEnv = { ...process.env };

afterEach(() => {
  process.env = { ...previousEnv };
});

describe("loadEnv", () => {
  it("accepts a matching network and passphrase", () => {
    process.env = {
      ...previousEnv,
      NODE_ENV: "test",
      PORT: "4000",
      STELLAR_NETWORK: "testnet",
      STELLAR_RPC_URL: "https://soroban-testnet.stellar.org",
      STELLAR_HORIZON_URL: "https://horizon-testnet.stellar.org",
      STELLAR_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
      DIKE_CONTRACTS_ROOT: "/tmp/contracts",
      DIKE_MANIFEST_PATH: "/tmp/contracts/deployments/testnet.json",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/dike_services",
      REDIS_URL: "redis://localhost:6379",
    };

    expect(loadEnv().STELLAR_NETWORK).toBe("testnet");
  });

  it("fails fast on network passphrase mismatch", () => {
    process.env = {
      ...previousEnv,
      NODE_ENV: "test",
      PORT: "4000",
      STELLAR_NETWORK: "testnet",
      STELLAR_RPC_URL: "https://soroban-testnet.stellar.org",
      STELLAR_HORIZON_URL: "https://horizon-testnet.stellar.org",
      STELLAR_NETWORK_PASSPHRASE: "Standalone Network ; February 2017",
      DIKE_CONTRACTS_ROOT: "/tmp/contracts",
      DIKE_MANIFEST_PATH: "/tmp/contracts/deployments/testnet.json",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/dike_services",
      REDIS_URL: "redis://localhost:6379",
    };

    expect(() => loadEnv()).toThrow(/Passphrase mismatch/);
  });

  it("rejects zero as an indexer start ledger", () => {
    process.env = {
      ...previousEnv,
      NODE_ENV: "test",
      PORT: "4000",
      STELLAR_NETWORK: "testnet",
      STELLAR_RPC_URL: "https://soroban-testnet.stellar.org",
      STELLAR_HORIZON_URL: "https://horizon-testnet.stellar.org",
      STELLAR_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
      DIKE_CONTRACTS_ROOT: "/tmp/contracts",
      DIKE_MANIFEST_PATH: "/tmp/contracts/deployments/testnet.json",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/dike_services",
      REDIS_URL: "redis://localhost:6379",
      INDEXER_START_LEDGER: "0",
    };

    expect(() => loadEnv()).toThrow();
  });
});
