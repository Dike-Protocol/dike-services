export const NETWORK_PASSPHRASES = {
  mainnet: "Public Global Stellar Network ; September 2015",
  testnet: "Test SDF Network ; September 2015",
  local: "Standalone Network ; February 2017",
} as const;

export type StellarNetworkName = keyof typeof NETWORK_PASSPHRASES;
