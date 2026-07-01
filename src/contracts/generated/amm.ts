import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





export type DataKey = {tag: "Admin", values: void} | {tag: "Role", values: readonly [string]} | {tag: "Vault", values: void} | {tag: "Tokens", values: void} | {tag: "Collateral", values: void} | {tag: "Registry", values: void} | {tag: "Pool", values: readonly [u64]} | {tag: "PoolFee", values: readonly [u64]} | {tag: "LpBalance", values: readonly [u64, string]} | {tag: "LpFeeCheckpoint", values: readonly [u64, string]} | {tag: "NextPoolId", values: void} | {tag: "Paused", values: void};










export type Outcome = {tag: "Yes", values: void} | {tag: "No", values: void} | {tag: "Invalid", values: void};


export interface PoolData {
  accumulated_cod_fees: i128;
  accumulated_lp_fees: i128;
  accumulated_protocol_fees: i128;
  fee_per_share_scaled: i128;
  id: u64;
  live: boolean;
  market_id: u64;
  no_reserve: i128;
  total_lp_shares: i128;
  yes_reserve: i128;
}

export const DikeError = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"Unauthorized"},
  4: {message:"InvalidAmount"},
  5: {message:"InvalidInput"},
  6: {message:"InvalidStatus"},
  7: {message:"InvalidTransition"},
  8: {message:"MarketExists"},
  9: {message:"MarketNotFound"},
  10: {message:"PoolNotFound"},
  11: {message:"RequestNotFound"},
  12: {message:"CaseNotFound"},
  13: {message:"AlreadyResolved"},
  14: {message:"AlreadyRedeemed"},
  15: {message:"InsufficientBalance"},
  16: {message:"InsufficientCollateral"},
  17: {message:"SlippageExceeded"},
  18: {message:"DeadlineExpired"},
  19: {message:"NotExpired"},
  20: {message:"DisputeWindowOpen"},
  21: {message:"DisputeWindowClosed"},
  22: {message:"EvidenceRequired"},
  23: {message:"AlreadyDisputed"},
  24: {message:"InvalidReveal"},
  25: {message:"VoteAlreadyCommitted"},
  26: {message:"VoteNotCommitted"},
  27: {message:"TooEarly"},
  28: {message:"TimelockNotReady"},
  29: {message:"ActionConsumed"},
  30: {message:"UnsupportedCollateral"},
  31: {message:"CreatorNotApproved"},
  32: {message:"ArithmeticError"},
  33: {message:"ChainDepthExceeded"},
  34: {message:"ChildCollateralLimitExceeded"},
  35: {message:"EncumberedPosition"}
}


export interface FeeConfig {
  cod_fee_share_bps: u32;
  council_reward: i128;
  creation_fee: i128;
  lp_fee_share_bps: u32;
  trading_fee_bps: u32;
  treasury_fee_share_bps: u32;
}


export interface MarketData {
  bond_amount: i128;
  collateral: string;
  created_at: u64;
  creator: string;
  dispute_window: u64;
  expiry: u64;
  fee_config: FeeConfig;
  final_outcome: Outcome;
  has_final_outcome: boolean;
  has_request: boolean;
  id: u64;
  no_token_id: u64;
  pool_id: u64;
  question: string;
  question_hash: Buffer;
  request_id: u64;
  rules_hash: Buffer;
  rules_uri: string;
  status: MarketStatus;
  yes_token_id: u64;
}


export interface TradeQuote {
  amount_in: i128;
  amount_out: i128;
  average_price_bps: u32;
  fee: i128;
  net_in: i128;
}


export interface CouncilCase {
  commit_end: u64;
  dispute_bond: i128;
  disputer: string;
  disputer_evidence_uri: string;
  disputer_outcome: Outcome;
  final_outcome: Outcome;
  has_final_outcome: boolean;
  id: u64;
  invalid_votes: u32;
  market_id: u64;
  no_votes: u32;
  proposal_bond: i128;
  proposer: string;
  proposer_evidence_uri: string;
  proposer_outcome: Outcome;
  request_id: u64;
  reveal_end: u64;
  status: CouncilCaseStatus;
  total_valid_votes: u32;
  voting_start: u64;
  yes_votes: u32;
}


export interface MarketConfig {
  bond_amount: i128;
  category: string;
  collateral: string;
  creator: string;
  dispute_window: u64;
  expiry: u64;
  fee_config: FeeConfig;
  question: string;
  question_hash: Buffer;
  rules_hash: Buffer;
  rules_uri: string;
}

export type MarketStatus = {tag: "Created", values: void} | {tag: "Live", values: void} | {tag: "Paused", values: void} | {tag: "TradingClosed", values: void} | {tag: "ResolutionRequested", values: void} | {tag: "Proposed", values: void} | {tag: "Disputed", values: void} | {tag: "CouncilVoting", values: void} | {tag: "Resolved", values: void} | {tag: "Cancelled", values: void};

export type OracleStatus = {tag: "None", values: void} | {tag: "Requested", values: void} | {tag: "Proposed", values: void} | {tag: "Disputed", values: void} | {tag: "Escalated", values: void} | {tag: "Finalized", values: void};


export interface OpenCaseConfig {
  commit_duration: u64;
  dispute_bond: i128;
  proposal_bond: i128;
  reveal_duration: u64;
  token: string;
}


export interface TimelockAction {
  cancelled: boolean;
  execute_after: u64;
  executed: boolean;
  expires_at: u64;
  id: u64;
  kind: TimelockActionKind;
  payload: TimelockPayload;
  payload_hash: Buffer;
  target: string;
}

export type TimelockPayload = {tag: "Treasury", values: readonly [string]} | {tag: "Creator", values: readonly [string, boolean]} | {tag: "CouncilMember", values: readonly [string, boolean]} | {tag: "SupportedCollateral", values: readonly [string, boolean]} | {tag: "ModuleAddress", values: readonly [string, string]} | {tag: "Pause", values: readonly [string]} | {tag: "FeeConfig", values: readonly [FeeConfig]} | {tag: "Upgrade", values: readonly [string, Buffer]};


export interface VaultAccounting {
  amm_collateral: i128;
  child_collateral_defaulted: i128;
  child_collateral_issued: i128;
  child_collateral_repaid: i128;
  cod_fees: i128;
  collateral_backing: i128;
  dispute_bonds: i128;
  lp_fees: i128;
  proposal_bonds: i128;
  protocol_fees: i128;
  redeemed: i128;
  refundable: i128;
  total_deposited: i128;
}

export type CouncilCaseStatus = {tag: "Opened", values: void} | {tag: "CommitPhase", values: void} | {tag: "RevealPhase", values: void} | {tag: "ReadyToFinalize", values: void} | {tag: "Finalized", values: void} | {tag: "Cancelled", values: void};


export interface ResolutionRequest {
  bond_amount: i128;
  dispute_evidence_uri: string;
  dispute_window: u64;
  disputed_at: u64;
  disputed_outcome: Outcome;
  disputer: string;
  expiry: u64;
  final_outcome: Outcome;
  has_dispute: boolean;
  has_final_outcome: boolean;
  has_proposal: boolean;
  id: u64;
  market_id: u64;
  proposal_evidence_uri: string;
  proposed_at: u64;
  proposed_outcome: Outcome;
  proposer: string;
  question_hash: Buffer;
  requested_at: u64;
  rules_uri: string;
  status: OracleStatus;
}

export type TimelockActionKind = {tag: "FeeConfig", values: void} | {tag: "Treasury", values: void} | {tag: "SupportedCollateral", values: void} | {tag: "Creator", values: void} | {tag: "CouncilMember", values: void} | {tag: "ModuleAddress", values: void} | {tag: "Pause", values: void} | {tag: "Upgrade", values: void};

export interface Client {
  /**
   * Construct and simulate a pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pool: ({pool_id}: {pool_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<PoolData>>>

  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pause: ({paused}: {paused: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a buy_no transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  buy_no: ({trader, pool_id, amount_in, min_out, deadline}: {trader: string, pool_id: u64, amount_in: i128, min_out: i128, deadline: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a buy_yes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  buy_yes: ({trader, pool_id, amount_in, min_out, deadline}: {trader: string, pool_id: u64, amount_in: i128, min_out: i128, deadline: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a sell_no transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  sell_no: ({trader, pool_id, amount_in, min_out, deadline}: {trader: string, pool_id: u64, amount_in: i128, min_out: i128, deadline: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a sell_yes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  sell_yes: ({trader, pool_id, amount_in, min_out, deadline}: {trader: string, pool_id: u64, amount_in: i128, min_out: i128, deadline: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a set_role transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_role: ({role, module}: {role: string, module: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_admin: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a lp_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  lp_balance: ({pool_id, owner}: {pool_id: u64, owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a create_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_pool: ({market_id, fee_config}: {market_id: u64, fee_config: FeeConfig}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a set_modules transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_modules: ({vault, tokens, collateral, registry}: {vault: string, tokens: string, collateral: string, registry: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a buy_child_no transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  buy_child_no: ({trader, parent_market_id, parent_outcome, pool_id, amount_in, min_out, deadline}: {trader: string, parent_market_id: u64, parent_outcome: Outcome, pool_id: u64, amount_in: i128, min_out: i128, deadline: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a quote_buy_no transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  quote_buy_no: ({pool_id, amount_in}: {pool_id: u64, amount_in: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<TradeQuote>>>

  /**
   * Construct and simulate a add_liquidity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_liquidity: ({lp, pool_id, amount}: {lp: string, pool_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a buy_child_yes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  buy_child_yes: ({trader, parent_market_id, parent_outcome, pool_id, amount_in, min_out, deadline}: {trader: string, parent_market_id: u64, parent_outcome: Outcome, pool_id: u64, amount_in: i128, min_out: i128, deadline: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a claim_lp_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  claim_lp_fees: ({lp, pool_id}: {lp: string, pool_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a quote_buy_yes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  quote_buy_yes: ({pool_id, amount_in}: {pool_id: u64, amount_in: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<TradeQuote>>>

  /**
   * Construct and simulate a seed_liquidity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  seed_liquidity: ({lp, pool_id, amount}: {lp: string, pool_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a remove_liquidity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  remove_liquidity: ({lp, pool_id, shares}: {lp: string, pool_id: u64, shares: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<readonly [i128, i128]>>>

  /**
   * Construct and simulate a claimable_lp_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  claimable_lp_fees: ({pool_id, owner}: {pool_id: u64, owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a lp_fee_checkpoint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  lp_fee_checkpoint: ({pool_id, owner}: {pool_id: u64, owner: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin}: {admin: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAEcG9vbAAAAAEAAAAAAAAAB3Bvb2xfaWQAAAAABgAAAAEAAAPpAAAH0AAAAAhQb29sRGF0YQAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAAFcGF1c2UAAAAAAAABAAAAAAAAAAZwYXVzZWQAAAAAAAEAAAABAAAD6QAAA+0AAAAAAAAH0AAAAAlEaWtlRXJyb3IAAAA=",
        "AAAAAAAAAAAAAAAGYnV5X25vAAAAAAAFAAAAAAAAAAZ0cmFkZXIAAAAAABMAAAAAAAAAB3Bvb2xfaWQAAAAABgAAAAAAAAAJYW1vdW50X2luAAAAAAAACwAAAAAAAAAHbWluX291dAAAAAALAAAAAAAAAAhkZWFkbGluZQAAAAYAAAABAAAD6QAAAAsAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAABQAAAAAAAAAAAAAABlBhdXNlZAAAAAAAAQAAAAVwYXVzZQAAAAAAAAEAAAAAAAAABnBhdXNlZAAAAAAAAQAAAAAAAAAA",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAADAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAEUm9sZQAAAAEAAAARAAAAAAAAAAAAAAAFVmF1bHQAAAAAAAAAAAAAAAAAAAZUb2tlbnMAAAAAAAAAAAAAAAAACkNvbGxhdGVyYWwAAAAAAAAAAAAAAAAACFJlZ2lzdHJ5AAAAAQAAAAAAAAAEUG9vbAAAAAEAAAAGAAAAAQAAAAAAAAAHUG9vbEZlZQAAAAABAAAABgAAAAEAAAAAAAAACUxwQmFsYW5jZQAAAAAAAAIAAAAGAAAAEwAAAAEAAAAAAAAAD0xwRmVlQ2hlY2twb2ludAAAAAACAAAABgAAABMAAAAAAAAAAAAAAApOZXh0UG9vbElkAAAAAAAAAAAAAAAAAAZQYXVzZWQAAA==",
        "AAAAAAAAAAAAAAAHYnV5X3llcwAAAAAFAAAAAAAAAAZ0cmFkZXIAAAAAABMAAAAAAAAAB3Bvb2xfaWQAAAAABgAAAAAAAAAJYW1vdW50X2luAAAAAAAACwAAAAAAAAAHbWluX291dAAAAAALAAAAAAAAAAhkZWFkbGluZQAAAAYAAAABAAAD6QAAAAsAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAHc2VsbF9ubwAAAAAFAAAAAAAAAAZ0cmFkZXIAAAAAABMAAAAAAAAAB3Bvb2xfaWQAAAAABgAAAAAAAAAJYW1vdW50X2luAAAAAAAACwAAAAAAAAAHbWluX291dAAAAAALAAAAAAAAAAhkZWFkbGluZQAAAAYAAAABAAAD6QAAAAsAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAABQAAAAAAAAAAAAAAB1JvbGVTZXQAAAAAAQAAAARyb2xlAAAAAgAAAAAAAAAEcm9sZQAAABEAAAABAAAAAAAAAAZtb2R1bGUAAAAAABMAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAIc2VsbF95ZXMAAAAFAAAAAAAAAAZ0cmFkZXIAAAAAABMAAAAAAAAAB3Bvb2xfaWQAAAAABgAAAAAAAAAJYW1vdW50X2luAAAAAAAACwAAAAAAAAAHbWluX291dAAAAAALAAAAAAAAAAhkZWFkbGluZQAAAAYAAAABAAAD6QAAAAsAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAIc2V0X3JvbGUAAAACAAAAAAAAAARyb2xlAAAAEQAAAAAAAAAGbW9kdWxlAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAABQAAAAAAAAAAAAAACEFkbWluU2V0AAAAAQAAAAVhZG1pbgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAA",
        "AAAAAAAAAAAAAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAAKbHBfYmFsYW5jZQAAAAAAAgAAAAAAAAAHcG9vbF9pZAAAAAAGAAAAAAAAAAVvd25lcgAAAAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAALY3JlYXRlX3Bvb2wAAAAAAgAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAKZmVlX2NvbmZpZwAAAAAH0AAAAAlGZWVDb25maWcAAAAAAAABAAAD6QAAAAYAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAALc2V0X21vZHVsZXMAAAAABAAAAAAAAAAFdmF1bHQAAAAAAAATAAAAAAAAAAZ0b2tlbnMAAAAAABMAAAAAAAAACmNvbGxhdGVyYWwAAAAAABMAAAAAAAAACHJlZ2lzdHJ5AAAAEwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAABQAAAAAAAAAAAAAAC0J1eUV4ZWN1dGVkAAAAAAEAAAADYnV5AAAAAAUAAAAAAAAAB3Bvb2xfaWQAAAAABgAAAAEAAAAAAAAABnRyYWRlcgAAAAAAEwAAAAEAAAAAAAAAA3llcwAAAAABAAAAAAAAAAAAAAAJYW1vdW50X2luAAAAAAAACwAAAAAAAAAAAAAACmFtb3VudF9vdXQAAAAAAAsAAAAAAAAAAQ==",
        "AAAABQAAAAAAAAAAAAAAC1Bvb2xDcmVhdGVkAAAAAAEAAAAEcG9vbAAAAAIAAAAAAAAACW1hcmtldF9pZAAAAAAAAAYAAAABAAAAAAAAAAdwb29sX2lkAAAAAAYAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAMYnV5X2NoaWxkX25vAAAABwAAAAAAAAAGdHJhZGVyAAAAAAATAAAAAAAAABBwYXJlbnRfbWFya2V0X2lkAAAABgAAAAAAAAAOcGFyZW50X291dGNvbWUAAAAAB9AAAAAHT3V0Y29tZQAAAAAAAAAAB3Bvb2xfaWQAAAAABgAAAAAAAAAJYW1vdW50X2luAAAAAAAACwAAAAAAAAAHbWluX291dAAAAAALAAAAAAAAAAhkZWFkbGluZQAAAAYAAAABAAAD6QAAAAsAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAMcXVvdGVfYnV5X25vAAAAAgAAAAAAAAAHcG9vbF9pZAAAAAAGAAAAAAAAAAlhbW91bnRfaW4AAAAAAAALAAAAAQAAA+kAAAfQAAAAClRyYWRlUXVvdGUAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAABQAAAAAAAAAAAAAADFNlbGxFeGVjdXRlZAAAAAEAAAAEc2VsbAAAAAUAAAAAAAAAB3Bvb2xfaWQAAAAABgAAAAEAAAAAAAAABnRyYWRlcgAAAAAAEwAAAAEAAAAAAAAAA3llcwAAAAABAAAAAAAAAAAAAAAJYW1vdW50X2luAAAAAAAACwAAAAAAAAAAAAAACmFtb3VudF9vdXQAAAAAAAsAAAAAAAAAAQ==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAANYWRkX2xpcXVpZGl0eQAAAAAAAAMAAAAAAAAAAmxwAAAAAAATAAAAAAAAAAdwb29sX2lkAAAAAAYAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAACwAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAANYnV5X2NoaWxkX3llcwAAAAAAAAcAAAAAAAAABnRyYWRlcgAAAAAAEwAAAAAAAAAQcGFyZW50X21hcmtldF9pZAAAAAYAAAAAAAAADnBhcmVudF9vdXRjb21lAAAAAAfQAAAAB091dGNvbWUAAAAAAAAAAAdwb29sX2lkAAAAAAYAAAAAAAAACWFtb3VudF9pbgAAAAAAAAsAAAAAAAAAB21pbl9vdXQAAAAACwAAAAAAAAAIZGVhZGxpbmUAAAAGAAAAAQAAA+kAAAALAAAH0AAAAAlEaWtlRXJyb3IAAAA=",
        "AAAAAAAAAAAAAAANY2xhaW1fbHBfZmVlcwAAAAAAAAIAAAAAAAAAAmxwAAAAAAATAAAAAAAAAAdwb29sX2lkAAAAAAYAAAABAAAD6QAAAAsAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAANcXVvdGVfYnV5X3llcwAAAAAAAAIAAAAAAAAAB3Bvb2xfaWQAAAAABgAAAAAAAAAJYW1vdW50X2luAAAAAAAACwAAAAEAAAPpAAAH0AAAAApUcmFkZVF1b3RlAAAAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAABQAAAAAAAAAAAAAADUxwRmVlc0NsYWltZWQAAAAAAAABAAAABWxwZmVlAAAAAAAAAwAAAAAAAAAHcG9vbF9pZAAAAAAGAAAAAQAAAAAAAAACbHAAAAAAABMAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAOc2VlZF9saXF1aWRpdHkAAAAAAAMAAAAAAAAAAmxwAAAAAAATAAAAAAAAAAdwb29sX2lkAAAAAAYAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAACwAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAABQAAAAAAAAAAAAAADkxpcXVpZGl0eUFkZGVkAAAAAAABAAAABmxwX2FkZAAAAAAABAAAAAAAAAAHcG9vbF9pZAAAAAAGAAAAAQAAAAAAAAACbHAAAAAAABMAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAAAAAAZzaGFyZXMAAAAAAAsAAAAAAAAAAQ==",
        "AAAABQAAAAAAAAAAAAAAD0xpcXVpZGl0eVNlZWRlZAAAAAABAAAABHNlZWQAAAADAAAAAAAAAAdwb29sX2lkAAAAAAYAAAABAAAAAAAAAAJscAAAAAAAEwAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAA",
        "AAAAAAAAAAAAAAAQcmVtb3ZlX2xpcXVpZGl0eQAAAAMAAAAAAAAAAmxwAAAAAAATAAAAAAAAAAdwb29sX2lkAAAAAAYAAAAAAAAABnNoYXJlcwAAAAAACwAAAAEAAAPpAAAD7QAAAAIAAAALAAAACwAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAABQAAAAAAAAAAAAAAEExpcXVpZGl0eVJlbW92ZWQAAAABAAAABWxwX3JtAAAAAAAABQAAAAAAAAAHcG9vbF9pZAAAAAAGAAAAAQAAAAAAAAACbHAAAAAAABMAAAABAAAAAAAAAAZzaGFyZXMAAAAAAAsAAAAAAAAAAAAAAAd5ZXNfb3V0AAAAAAsAAAAAAAAAAAAAAAZub19vdXQAAAAAAAsAAAAAAAAAAQ==",
        "AAAAAAAAAAAAAAARY2xhaW1hYmxlX2xwX2ZlZXMAAAAAAAACAAAAAAAAAAdwb29sX2lkAAAAAAYAAAAAAAAABW93bmVyAAAAAAAAEwAAAAEAAAPpAAAACwAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAARbHBfZmVlX2NoZWNrcG9pbnQAAAAAAAACAAAAAAAAAAdwb29sX2lkAAAAAAYAAAAAAAAABW93bmVyAAAAAAAAEwAAAAEAAAAL",
        "AAAAAgAAAAAAAAAAAAAAB091dGNvbWUAAAAAAwAAAAAAAAAAAAAAA1llcwAAAAAAAAAAAAAAAAJObwAAAAAAAAAAAAAAAAAHSW52YWxpZAA=",
        "AAAAAQAAAAAAAAAAAAAACFBvb2xEYXRhAAAACgAAAAAAAAAUYWNjdW11bGF0ZWRfY29kX2ZlZXMAAAALAAAAAAAAABNhY2N1bXVsYXRlZF9scF9mZWVzAAAAAAsAAAAAAAAAGWFjY3VtdWxhdGVkX3Byb3RvY29sX2ZlZXMAAAAAAAALAAAAAAAAABRmZWVfcGVyX3NoYXJlX3NjYWxlZAAAAAsAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAARsaXZlAAAAAQAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAKbm9fcmVzZXJ2ZQAAAAAACwAAAAAAAAAPdG90YWxfbHBfc2hhcmVzAAAAAAsAAAAAAAAAC3llc19yZXNlcnZlAAAAAAs=",
        "AAAABAAAAAAAAAAAAAAACURpa2VFcnJvcgAAAAAAACMAAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAQAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAIAAAAAAAAADFVuYXV0aG9yaXplZAAAAAMAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAEAAAAAAAAAAxJbnZhbGlkSW5wdXQAAAAFAAAAAAAAAA1JbnZhbGlkU3RhdHVzAAAAAAAABgAAAAAAAAARSW52YWxpZFRyYW5zaXRpb24AAAAAAAAHAAAAAAAAAAxNYXJrZXRFeGlzdHMAAAAIAAAAAAAAAA5NYXJrZXROb3RGb3VuZAAAAAAACQAAAAAAAAAMUG9vbE5vdEZvdW5kAAAACgAAAAAAAAAPUmVxdWVzdE5vdEZvdW5kAAAAAAsAAAAAAAAADENhc2VOb3RGb3VuZAAAAAwAAAAAAAAAD0FscmVhZHlSZXNvbHZlZAAAAAANAAAAAAAAAA9BbHJlYWR5UmVkZWVtZWQAAAAADgAAAAAAAAATSW5zdWZmaWNpZW50QmFsYW5jZQAAAAAPAAAAAAAAABZJbnN1ZmZpY2llbnRDb2xsYXRlcmFsAAAAAAAQAAAAAAAAABBTbGlwcGFnZUV4Y2VlZGVkAAAAEQAAAAAAAAAPRGVhZGxpbmVFeHBpcmVkAAAAABIAAAAAAAAACk5vdEV4cGlyZWQAAAAAABMAAAAAAAAAEURpc3B1dGVXaW5kb3dPcGVuAAAAAAAAFAAAAAAAAAATRGlzcHV0ZVdpbmRvd0Nsb3NlZAAAAAAVAAAAAAAAABBFdmlkZW5jZVJlcXVpcmVkAAAAFgAAAAAAAAAPQWxyZWFkeURpc3B1dGVkAAAAABcAAAAAAAAADUludmFsaWRSZXZlYWwAAAAAAAAYAAAAAAAAABRWb3RlQWxyZWFkeUNvbW1pdHRlZAAAABkAAAAAAAAAEFZvdGVOb3RDb21taXR0ZWQAAAAaAAAAAAAAAAhUb29FYXJseQAAABsAAAAAAAAAEFRpbWVsb2NrTm90UmVhZHkAAAAcAAAAAAAAAA5BY3Rpb25Db25zdW1lZAAAAAAAHQAAAAAAAAAVVW5zdXBwb3J0ZWRDb2xsYXRlcmFsAAAAAAAAHgAAAAAAAAASQ3JlYXRvck5vdEFwcHJvdmVkAAAAAAAfAAAAAAAAAA9Bcml0aG1ldGljRXJyb3IAAAAAIAAAAAAAAAASQ2hhaW5EZXB0aEV4Y2VlZGVkAAAAAAAhAAAAAAAAABxDaGlsZENvbGxhdGVyYWxMaW1pdEV4Y2VlZGVkAAAAIgAAAAAAAAASRW5jdW1iZXJlZFBvc2l0aW9uAAAAAAAj",
        "AAAAAQAAAAAAAAAAAAAACUZlZUNvbmZpZwAAAAAAAAYAAAAAAAAAEWNvZF9mZWVfc2hhcmVfYnBzAAAAAAAABAAAAAAAAAAOY291bmNpbF9yZXdhcmQAAAAAAAsAAAAAAAAADGNyZWF0aW9uX2ZlZQAAAAsAAAAAAAAAEGxwX2ZlZV9zaGFyZV9icHMAAAAEAAAAAAAAAA90cmFkaW5nX2ZlZV9icHMAAAAABAAAAAAAAAAWdHJlYXN1cnlfZmVlX3NoYXJlX2JwcwAAAAAABA==",
        "AAAAAQAAAAAAAAAAAAAACk1hcmtldERhdGEAAAAAABQAAAAAAAAAC2JvbmRfYW1vdW50AAAAAAsAAAAAAAAACmNvbGxhdGVyYWwAAAAAABMAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAOZGlzcHV0ZV93aW5kb3cAAAAAAAYAAAAAAAAABmV4cGlyeQAAAAAABgAAAAAAAAAKZmVlX2NvbmZpZwAAAAAH0AAAAAlGZWVDb25maWcAAAAAAAAAAAAADWZpbmFsX291dGNvbWUAAAAAAAfQAAAAB091dGNvbWUAAAAAAAAAABFoYXNfZmluYWxfb3V0Y29tZQAAAAAAAAEAAAAAAAAAC2hhc19yZXF1ZXN0AAAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAtub190b2tlbl9pZAAAAAAGAAAAAAAAAAdwb29sX2lkAAAAAAYAAAAAAAAACHF1ZXN0aW9uAAAAEAAAAAAAAAANcXVlc3Rpb25faGFzaAAAAAAAA+4AAAAgAAAAAAAAAApyZXF1ZXN0X2lkAAAAAAAGAAAAAAAAAApydWxlc19oYXNoAAAAAAPuAAAAIAAAAAAAAAAJcnVsZXNfdXJpAAAAAAAAEAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADE1hcmtldFN0YXR1cwAAAAAAAAAMeWVzX3Rva2VuX2lkAAAABg==",
        "AAAAAQAAAAAAAAAAAAAAClRyYWRlUXVvdGUAAAAAAAUAAAAAAAAACWFtb3VudF9pbgAAAAAAAAsAAAAAAAAACmFtb3VudF9vdXQAAAAAAAsAAAAAAAAAEWF2ZXJhZ2VfcHJpY2VfYnBzAAAAAAAABAAAAAAAAAADZmVlAAAAAAsAAAAAAAAABm5ldF9pbgAAAAAACw==",
        "AAAAAQAAAAAAAAAAAAAAC0NvdW5jaWxDYXNlAAAAABUAAAAAAAAACmNvbW1pdF9lbmQAAAAAAAYAAAAAAAAADGRpc3B1dGVfYm9uZAAAAAsAAAAAAAAACGRpc3B1dGVyAAAAEwAAAAAAAAAVZGlzcHV0ZXJfZXZpZGVuY2VfdXJpAAAAAAAAEAAAAAAAAAAQZGlzcHV0ZXJfb3V0Y29tZQAAB9AAAAAHT3V0Y29tZQAAAAAAAAAADWZpbmFsX291dGNvbWUAAAAAAAfQAAAAB091dGNvbWUAAAAAAAAAABFoYXNfZmluYWxfb3V0Y29tZQAAAAAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAA1pbnZhbGlkX3ZvdGVzAAAAAAAABAAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAIbm9fdm90ZXMAAAAEAAAAAAAAAA1wcm9wb3NhbF9ib25kAAAAAAAACwAAAAAAAAAIcHJvcG9zZXIAAAATAAAAAAAAABVwcm9wb3Nlcl9ldmlkZW5jZV91cmkAAAAAAAAQAAAAAAAAABBwcm9wb3Nlcl9vdXRjb21lAAAH0AAAAAdPdXRjb21lAAAAAAAAAAAKcmVxdWVzdF9pZAAAAAAABgAAAAAAAAAKcmV2ZWFsX2VuZAAAAAAABgAAAAAAAAAGc3RhdHVzAAAAAAfQAAAAEUNvdW5jaWxDYXNlU3RhdHVzAAAAAAAAAAAAABF0b3RhbF92YWxpZF92b3RlcwAAAAAAAAQAAAAAAAAADHZvdGluZ19zdGFydAAAAAYAAAAAAAAACXllc192b3RlcwAAAAAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAADE1hcmtldENvbmZpZwAAAAsAAAAAAAAAC2JvbmRfYW1vdW50AAAAAAsAAAAAAAAACGNhdGVnb3J5AAAAEAAAAAAAAAAKY29sbGF0ZXJhbAAAAAAAEwAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAA5kaXNwdXRlX3dpbmRvdwAAAAAABgAAAAAAAAAGZXhwaXJ5AAAAAAAGAAAAAAAAAApmZWVfY29uZmlnAAAAAAfQAAAACUZlZUNvbmZpZwAAAAAAAAAAAAAIcXVlc3Rpb24AAAAQAAAAAAAAAA1xdWVzdGlvbl9oYXNoAAAAAAAD7gAAACAAAAAAAAAACnJ1bGVzX2hhc2gAAAAAA+4AAAAgAAAAAAAAAAlydWxlc191cmkAAAAAAAAQ",
        "AAAAAgAAAAAAAAAAAAAADE1hcmtldFN0YXR1cwAAAAoAAAAAAAAAAAAAAAdDcmVhdGVkAAAAAAAAAAAAAAAABExpdmUAAAAAAAAAAAAAAAZQYXVzZWQAAAAAAAAAAAAAAAAADVRyYWRpbmdDbG9zZWQAAAAAAAAAAAAAAAAAABNSZXNvbHV0aW9uUmVxdWVzdGVkAAAAAAAAAAAAAAAACFByb3Bvc2VkAAAAAAAAAAAAAAAIRGlzcHV0ZWQAAAAAAAAAAAAAAA1Db3VuY2lsVm90aW5nAAAAAAAAAAAAAAAAAAAIUmVzb2x2ZWQAAAAAAAAAAAAAAAlDYW5jZWxsZWQAAAA=",
        "AAAAAgAAAAAAAAAAAAAADE9yYWNsZVN0YXR1cwAAAAYAAAAAAAAAAAAAAAROb25lAAAAAAAAAAAAAAAJUmVxdWVzdGVkAAAAAAAAAAAAAAAAAAAIUHJvcG9zZWQAAAAAAAAAAAAAAAhEaXNwdXRlZAAAAAAAAAAAAAAACUVzY2FsYXRlZAAAAAAAAAAAAAAAAAAACUZpbmFsaXplZAAAAA==",
        "AAAAAQAAAAAAAAAAAAAADk9wZW5DYXNlQ29uZmlnAAAAAAAFAAAAAAAAAA9jb21taXRfZHVyYXRpb24AAAAABgAAAAAAAAAMZGlzcHV0ZV9ib25kAAAACwAAAAAAAAANcHJvcG9zYWxfYm9uZAAAAAAAAAsAAAAAAAAAD3JldmVhbF9kdXJhdGlvbgAAAAAGAAAAAAAAAAV0b2tlbgAAAAAAABM=",
        "AAAAAQAAAAAAAAAAAAAADlRpbWVsb2NrQWN0aW9uAAAAAAAJAAAAAAAAAAljYW5jZWxsZWQAAAAAAAABAAAAAAAAAA1leGVjdXRlX2FmdGVyAAAAAAAABgAAAAAAAAAIZXhlY3V0ZWQAAAABAAAAAAAAAApleHBpcmVzX2F0AAAAAAAGAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAEa2luZAAAB9AAAAASVGltZWxvY2tBY3Rpb25LaW5kAAAAAAAAAAAAB3BheWxvYWQAAAAH0AAAAA9UaW1lbG9ja1BheWxvYWQAAAAAAAAAAAxwYXlsb2FkX2hhc2gAAAPuAAAAIAAAAAAAAAAGdGFyZ2V0AAAAAAAT",
        "AAAAAgAAAAAAAAAAAAAAD1RpbWVsb2NrUGF5bG9hZAAAAAAIAAAAAQAAAAAAAAAIVHJlYXN1cnkAAAABAAAAEwAAAAEAAAAAAAAAB0NyZWF0b3IAAAAAAgAAABMAAAABAAAAAQAAAAAAAAANQ291bmNpbE1lbWJlcgAAAAAAAAIAAAATAAAAAQAAAAEAAAAAAAAAE1N1cHBvcnRlZENvbGxhdGVyYWwAAAAAAgAAABMAAAABAAAAAQAAAAAAAAANTW9kdWxlQWRkcmVzcwAAAAAAAAIAAAARAAAAEwAAAAEAAAAAAAAABVBhdXNlAAAAAAAAAQAAABMAAAABAAAAAAAAAAlGZWVDb25maWcAAAAAAAABAAAH0AAAAAlGZWVDb25maWcAAAAAAAABAAAAAAAAAAdVcGdyYWRlAAAAAAIAAAARAAAD7gAAACA=",
        "AAAAAQAAAAAAAAAAAAAAD1ZhdWx0QWNjb3VudGluZwAAAAANAAAAAAAAAA5hbW1fY29sbGF0ZXJhbAAAAAAACwAAAAAAAAAaY2hpbGRfY29sbGF0ZXJhbF9kZWZhdWx0ZWQAAAAAAAsAAAAAAAAAF2NoaWxkX2NvbGxhdGVyYWxfaXNzdWVkAAAAAAsAAAAAAAAAF2NoaWxkX2NvbGxhdGVyYWxfcmVwYWlkAAAAAAsAAAAAAAAACGNvZF9mZWVzAAAACwAAAAAAAAASY29sbGF0ZXJhbF9iYWNraW5nAAAAAAALAAAAAAAAAA1kaXNwdXRlX2JvbmRzAAAAAAAACwAAAAAAAAAHbHBfZmVlcwAAAAALAAAAAAAAAA5wcm9wb3NhbF9ib25kcwAAAAAACwAAAAAAAAANcHJvdG9jb2xfZmVlcwAAAAAAAAsAAAAAAAAACHJlZGVlbWVkAAAACwAAAAAAAAAKcmVmdW5kYWJsZQAAAAAACwAAAAAAAAAPdG90YWxfZGVwb3NpdGVkAAAAAAs=",
        "AAAAAgAAAAAAAAAAAAAAEUNvdW5jaWxDYXNlU3RhdHVzAAAAAAAABgAAAAAAAAAAAAAABk9wZW5lZAAAAAAAAAAAAAAAAAALQ29tbWl0UGhhc2UAAAAAAAAAAAAAAAALUmV2ZWFsUGhhc2UAAAAAAAAAAAAAAAAPUmVhZHlUb0ZpbmFsaXplAAAAAAAAAAAAAAAACUZpbmFsaXplZAAAAAAAAAAAAAAAAAAACUNhbmNlbGxlZAAAAA==",
        "AAAAAQAAAAAAAAAAAAAAEVJlc29sdXRpb25SZXF1ZXN0AAAAAAAAFQAAAAAAAAALYm9uZF9hbW91bnQAAAAACwAAAAAAAAAUZGlzcHV0ZV9ldmlkZW5jZV91cmkAAAAQAAAAAAAAAA5kaXNwdXRlX3dpbmRvdwAAAAAABgAAAAAAAAALZGlzcHV0ZWRfYXQAAAAABgAAAAAAAAAQZGlzcHV0ZWRfb3V0Y29tZQAAB9AAAAAHT3V0Y29tZQAAAAAAAAAACGRpc3B1dGVyAAAAEwAAAAAAAAAGZXhwaXJ5AAAAAAAGAAAAAAAAAA1maW5hbF9vdXRjb21lAAAAAAAH0AAAAAdPdXRjb21lAAAAAAAAAAALaGFzX2Rpc3B1dGUAAAAAAQAAAAAAAAARaGFzX2ZpbmFsX291dGNvbWUAAAAAAAABAAAAAAAAAAxoYXNfcHJvcG9zYWwAAAABAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAVcHJvcG9zYWxfZXZpZGVuY2VfdXJpAAAAAAAAEAAAAAAAAAALcHJvcG9zZWRfYXQAAAAABgAAAAAAAAAQcHJvcG9zZWRfb3V0Y29tZQAAB9AAAAAHT3V0Y29tZQAAAAAAAAAACHByb3Bvc2VyAAAAEwAAAAAAAAANcXVlc3Rpb25faGFzaAAAAAAAA+4AAAAgAAAAAAAAAAxyZXF1ZXN0ZWRfYXQAAAAGAAAAAAAAAAlydWxlc191cmkAAAAAAAAQAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAMT3JhY2xlU3RhdHVz",
        "AAAAAgAAAAAAAAAAAAAAElRpbWVsb2NrQWN0aW9uS2luZAAAAAAACAAAAAAAAAAAAAAACUZlZUNvbmZpZwAAAAAAAAAAAAAAAAAACFRyZWFzdXJ5AAAAAAAAAAAAAAATU3VwcG9ydGVkQ29sbGF0ZXJhbAAAAAAAAAAAAAAAAAdDcmVhdG9yAAAAAAAAAAAAAAAADUNvdW5jaWxNZW1iZXIAAAAAAAAAAAAAAAAAAA1Nb2R1bGVBZGRyZXNzAAAAAAAAAAAAAAAAAAAFUGF1c2UAAAAAAAAAAAAAAAAAAAdVcGdyYWRlAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    pool: this.txFromJSON<Result<PoolData>>,
        pause: this.txFromJSON<Result<void>>,
        buy_no: this.txFromJSON<Result<i128>>,
        buy_yes: this.txFromJSON<Result<i128>>,
        sell_no: this.txFromJSON<Result<i128>>,
        sell_yes: this.txFromJSON<Result<i128>>,
        set_role: this.txFromJSON<Result<void>>,
        set_admin: this.txFromJSON<Result<void>>,
        lp_balance: this.txFromJSON<i128>,
        create_pool: this.txFromJSON<Result<u64>>,
        set_modules: this.txFromJSON<Result<void>>,
        buy_child_no: this.txFromJSON<Result<i128>>,
        quote_buy_no: this.txFromJSON<Result<TradeQuote>>,
        add_liquidity: this.txFromJSON<Result<i128>>,
        buy_child_yes: this.txFromJSON<Result<i128>>,
        claim_lp_fees: this.txFromJSON<Result<i128>>,
        quote_buy_yes: this.txFromJSON<Result<TradeQuote>>,
        seed_liquidity: this.txFromJSON<Result<i128>>,
        remove_liquidity: this.txFromJSON<Result<readonly [i128, i128]>>,
        claimable_lp_fees: this.txFromJSON<Result<i128>>,
        lp_fee_checkpoint: this.txFromJSON<i128>
  }
}