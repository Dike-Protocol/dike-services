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





export type DataKey = {tag: "Admin", values: void} | {tag: "Role", values: readonly [string]} | {tag: "Member", values: readonly [string]} | {tag: "Case", values: readonly [u64]} | {tag: "RequestCase", values: readonly [u64]} | {tag: "NextCaseId", values: void} | {tag: "Commit", values: readonly [u64, string]} | {tag: "Reveal", values: readonly [u64, string]} | {tag: "Claimed", values: readonly [u64, string]} | {tag: "Paused", values: void};








export type Outcome = {tag: "Yes", values: void} | {tag: "No", values: void} | {tag: "Invalid", values: void};


export interface PoolData {
  accumulated_cod_fees: i128;
  accumulated_lp_fees: i128;
  accumulated_protocol_fees: i128;
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
  dispute_reward: i128;
  lp_fee_share_bps: u32;
  proposal_reward: i128;
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
}


export interface TimelockAction {
  cancelled: boolean;
  execute_after: u64;
  executed: boolean;
  expires_at: u64;
  id: u64;
  kind: TimelockActionKind;
  payload_hash: Buffer;
  target: string;
}


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
   * Construct and simulate a case transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  case: ({case_id}: {case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<CouncilCase>>>

  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pause: ({paused}: {paused: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_role transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_role: ({role, module}: {role: string, module: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a open_case transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  open_case: ({request_id, market_id, proposer, proposer_outcome, proposer_evidence_uri, disputer, disputer_outcome, disputer_evidence_uri, config}: {request_id: u64, market_id: u64, proposer: string, proposer_outcome: Outcome, proposer_evidence_uri: string, disputer: string, disputer_outcome: Outcome, disputer_evidence_uri: string, config: OpenCaseConfig}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a set_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_member: ({member, approved}: {member: string, approved: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a commit_vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  commit_vote: ({voter, case_id, commitment}: {voter: string, case_id: u64, commitment: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a reveal_vote transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  reveal_vote: ({voter, case_id, outcome, salt}: {voter: string, case_id: u64, outcome: Outcome, salt: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a claim_reward transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  claim_reward: ({voter, case_id}: {voter: string, case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<boolean>>>

  /**
   * Construct and simulate a finalize_case transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  finalize_case: ({case_id}: {case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Outcome>>>

  /**
   * Construct and simulate a vote_commitment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  vote_commitment: ({case_id, voter, outcome, salt}: {case_id: u64, voter: string, outcome: Outcome, salt: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a case_for_request transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  case_for_request: ({request_id}: {request_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a finalize_and_report_case transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  finalize_and_report_case: ({case_id}: {case_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Outcome>>>

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
      new ContractSpec([ "AAAABQAAAAAAAAAAAAAABlBhdXNlZAAAAAAAAQAAAAVwYXVzZQAAAAAAAAEAAAAAAAAABnBhdXNlZAAAAAAAAQAAAAAAAAAA",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAACgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAEUm9sZQAAAAEAAAARAAAAAQAAAAAAAAAGTWVtYmVyAAAAAAABAAAAEwAAAAEAAAAAAAAABENhc2UAAAABAAAABgAAAAEAAAAAAAAAC1JlcXVlc3RDYXNlAAAAAAEAAAAGAAAAAAAAAAAAAAAKTmV4dENhc2VJZAAAAAAAAQAAAAAAAAAGQ29tbWl0AAAAAAACAAAABgAAABMAAAABAAAAAAAAAAZSZXZlYWwAAAAAAAIAAAAGAAAAEwAAAAEAAAAAAAAAB0NsYWltZWQAAAAAAgAAAAYAAAATAAAAAAAAAAAAAAAGUGF1c2VkAAA=",
        "AAAABQAAAAAAAAAAAAAAB1JvbGVTZXQAAAAAAQAAAARyb2xlAAAAAgAAAAAAAAAEcm9sZQAAABEAAAABAAAAAAAAAAZtb2R1bGUAAAAAABMAAAAAAAAAAA==",
        "AAAABQAAAAAAAAAAAAAACU1lbWJlclNldAAAAAAAAAEAAAAGbWVtYmVyAAAAAAACAAAAAAAAAAZtZW1iZXIAAAAAABMAAAABAAAAAAAAAAhhcHByb3ZlZAAAAAEAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAEY2FzZQAAAAEAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAEAAAPpAAAH0AAAAAtDb3VuY2lsQ2FzZQAAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAABQAAAAAAAAAAAAAACkNhc2VPcGVuZWQAAAAAAAEAAAAEY2FzZQAAAAIAAAAAAAAACnJlcXVlc3RfaWQAAAAAAAYAAAABAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAFcGF1c2UAAAAAAAABAAAAAAAAAAZwYXVzZWQAAAAAAAEAAAABAAAD6QAAA+0AAAAAAAAH0AAAAAlEaWtlRXJyb3IAAAA=",
        "AAAABQAAAAAAAAAAAAAADFZvdGVSZXZlYWxlZAAAAAEAAAAGcmV2ZWFsAAAAAAADAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAABAAAAAAAAAAV2b3RlcgAAAAAAABMAAAABAAAAAAAAAAdvdXRjb21lAAAAB9AAAAAHT3V0Y29tZQAAAAAAAAAAAA==",
        "AAAABQAAAAAAAAAAAAAADUNhc2VGaW5hbGl6ZWQAAAAAAAABAAAAB2Nhc2VmaW4AAAAAAgAAAAAAAAAHY2FzZV9pZAAAAAAGAAAAAQAAAAAAAAAHb3V0Y29tZQAAAAfQAAAAB091dGNvbWUAAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAADVJld2FyZENsYWltZWQAAAAAAAABAAAABnJld2FyZAAAAAAAAwAAAAAAAAAHY2FzZV9pZAAAAAAGAAAAAQAAAAAAAAAFdm90ZXIAAAAAAAATAAAAAQAAAAAAAAAHY29ycmVjdAAAAAABAAAAAAAAAAA=",
        "AAAABQAAAAAAAAAAAAAADVZvdGVDb21taXR0ZWQAAAAAAAABAAAABmNvbW1pdAAAAAAAAwAAAAAAAAAHY2FzZV9pZAAAAAAGAAAAAQAAAAAAAAAFdm90ZXIAAAAAAAATAAAAAQAAAAAAAAAKY29tbWl0bWVudAAAAAAD7gAAACAAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAIc2V0X3JvbGUAAAACAAAAAAAAAARyb2xlAAAAEQAAAAAAAAAGbW9kdWxlAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAAJb3Blbl9jYXNlAAAAAAAACQAAAAAAAAAKcmVxdWVzdF9pZAAAAAAABgAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAIcHJvcG9zZXIAAAATAAAAAAAAABBwcm9wb3Nlcl9vdXRjb21lAAAH0AAAAAdPdXRjb21lAAAAAAAAAAAVcHJvcG9zZXJfZXZpZGVuY2VfdXJpAAAAAAAAEAAAAAAAAAAIZGlzcHV0ZXIAAAATAAAAAAAAABBkaXNwdXRlcl9vdXRjb21lAAAH0AAAAAdPdXRjb21lAAAAAAAAAAAVZGlzcHV0ZXJfZXZpZGVuY2VfdXJpAAAAAAAAEAAAAAAAAAAGY29uZmlnAAAAAAfQAAAADk9wZW5DYXNlQ29uZmlnAAAAAAABAAAD6QAAAAYAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAKc2V0X21lbWJlcgAAAAAAAgAAAAAAAAAGbWVtYmVyAAAAAAATAAAAAAAAAAhhcHByb3ZlZAAAAAEAAAABAAAD6QAAA+0AAAAAAAAH0AAAAAlEaWtlRXJyb3IAAAA=",
        "AAAAAAAAAAAAAAALY29tbWl0X3ZvdGUAAAAAAwAAAAAAAAAFdm90ZXIAAAAAAAATAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAAAAAAACmNvbW1pdG1lbnQAAAAAA+4AAAAgAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAALcmV2ZWFsX3ZvdGUAAAAABAAAAAAAAAAFdm90ZXIAAAAAAAATAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAAAAAAAB291dGNvbWUAAAAH0AAAAAdPdXRjb21lAAAAAAAAAAAEc2FsdAAAA+4AAAAgAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAAMY2xhaW1fcmV3YXJkAAAAAgAAAAAAAAAFdm90ZXIAAAAAAAATAAAAAAAAAAdjYXNlX2lkAAAAAAYAAAABAAAD6QAAAAEAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAANZmluYWxpemVfY2FzZQAAAAAAAAEAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAEAAAPpAAAH0AAAAAdPdXRjb21lAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAAPdm90ZV9jb21taXRtZW50AAAAAAQAAAAAAAAAB2Nhc2VfaWQAAAAABgAAAAAAAAAFdm90ZXIAAAAAAAATAAAAAAAAAAdvdXRjb21lAAAAB9AAAAAHT3V0Y29tZQAAAAAAAAAABHNhbHQAAAPuAAAAIAAAAAEAAAPuAAAAIA==",
        "AAAAAAAAAAAAAAAQY2FzZV9mb3JfcmVxdWVzdAAAAAEAAAAAAAAACnJlcXVlc3RfaWQAAAAAAAYAAAABAAAD6QAAAAYAAAfQAAAACURpa2VFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAYZmluYWxpemVfYW5kX3JlcG9ydF9jYXNlAAAAAQAAAAAAAAAHY2FzZV9pZAAAAAAGAAAAAQAAA+kAAAfQAAAAB091dGNvbWUAAAAH0AAAAAlEaWtlRXJyb3IAAAA=",
        "AAAAAgAAAAAAAAAAAAAAB091dGNvbWUAAAAAAwAAAAAAAAAAAAAAA1llcwAAAAAAAAAAAAAAAAJObwAAAAAAAAAAAAAAAAAHSW52YWxpZAA=",
        "AAAAAQAAAAAAAAAAAAAACFBvb2xEYXRhAAAACQAAAAAAAAAUYWNjdW11bGF0ZWRfY29kX2ZlZXMAAAALAAAAAAAAABNhY2N1bXVsYXRlZF9scF9mZWVzAAAAAAsAAAAAAAAAGWFjY3VtdWxhdGVkX3Byb3RvY29sX2ZlZXMAAAAAAAALAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAEbGl2ZQAAAAEAAAAAAAAACW1hcmtldF9pZAAAAAAAAAYAAAAAAAAACm5vX3Jlc2VydmUAAAAAAAsAAAAAAAAAD3RvdGFsX2xwX3NoYXJlcwAAAAALAAAAAAAAAAt5ZXNfcmVzZXJ2ZQAAAAAL",
        "AAAABAAAAAAAAAAAAAAACURpa2VFcnJvcgAAAAAAACMAAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAQAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAIAAAAAAAAADFVuYXV0aG9yaXplZAAAAAMAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAEAAAAAAAAAAxJbnZhbGlkSW5wdXQAAAAFAAAAAAAAAA1JbnZhbGlkU3RhdHVzAAAAAAAABgAAAAAAAAARSW52YWxpZFRyYW5zaXRpb24AAAAAAAAHAAAAAAAAAAxNYXJrZXRFeGlzdHMAAAAIAAAAAAAAAA5NYXJrZXROb3RGb3VuZAAAAAAACQAAAAAAAAAMUG9vbE5vdEZvdW5kAAAACgAAAAAAAAAPUmVxdWVzdE5vdEZvdW5kAAAAAAsAAAAAAAAADENhc2VOb3RGb3VuZAAAAAwAAAAAAAAAD0FscmVhZHlSZXNvbHZlZAAAAAANAAAAAAAAAA9BbHJlYWR5UmVkZWVtZWQAAAAADgAAAAAAAAATSW5zdWZmaWNpZW50QmFsYW5jZQAAAAAPAAAAAAAAABZJbnN1ZmZpY2llbnRDb2xsYXRlcmFsAAAAAAAQAAAAAAAAABBTbGlwcGFnZUV4Y2VlZGVkAAAAEQAAAAAAAAAPRGVhZGxpbmVFeHBpcmVkAAAAABIAAAAAAAAACk5vdEV4cGlyZWQAAAAAABMAAAAAAAAAEURpc3B1dGVXaW5kb3dPcGVuAAAAAAAAFAAAAAAAAAATRGlzcHV0ZVdpbmRvd0Nsb3NlZAAAAAAVAAAAAAAAABBFdmlkZW5jZVJlcXVpcmVkAAAAFgAAAAAAAAAPQWxyZWFkeURpc3B1dGVkAAAAABcAAAAAAAAADUludmFsaWRSZXZlYWwAAAAAAAAYAAAAAAAAABRWb3RlQWxyZWFkeUNvbW1pdHRlZAAAABkAAAAAAAAAEFZvdGVOb3RDb21taXR0ZWQAAAAaAAAAAAAAAAhUb29FYXJseQAAABsAAAAAAAAAEFRpbWVsb2NrTm90UmVhZHkAAAAcAAAAAAAAAA5BY3Rpb25Db25zdW1lZAAAAAAAHQAAAAAAAAAVVW5zdXBwb3J0ZWRDb2xsYXRlcmFsAAAAAAAAHgAAAAAAAAASQ3JlYXRvck5vdEFwcHJvdmVkAAAAAAAfAAAAAAAAAA9Bcml0aG1ldGljRXJyb3IAAAAAIAAAAAAAAAASQ2hhaW5EZXB0aEV4Y2VlZGVkAAAAAAAhAAAAAAAAABxDaGlsZENvbGxhdGVyYWxMaW1pdEV4Y2VlZGVkAAAAIgAAAAAAAAASRW5jdW1iZXJlZFBvc2l0aW9uAAAAAAAj",
        "AAAAAQAAAAAAAAAAAAAACUZlZUNvbmZpZwAAAAAAAAgAAAAAAAAAEWNvZF9mZWVfc2hhcmVfYnBzAAAAAAAABAAAAAAAAAAOY291bmNpbF9yZXdhcmQAAAAAAAsAAAAAAAAADGNyZWF0aW9uX2ZlZQAAAAsAAAAAAAAADmRpc3B1dGVfcmV3YXJkAAAAAAALAAAAAAAAABBscF9mZWVfc2hhcmVfYnBzAAAABAAAAAAAAAAPcHJvcG9zYWxfcmV3YXJkAAAAAAsAAAAAAAAAD3RyYWRpbmdfZmVlX2JwcwAAAAAEAAAAAAAAABZ0cmVhc3VyeV9mZWVfc2hhcmVfYnBzAAAAAAAE",
        "AAAAAQAAAAAAAAAAAAAACk1hcmtldERhdGEAAAAAABQAAAAAAAAAC2JvbmRfYW1vdW50AAAAAAsAAAAAAAAACmNvbGxhdGVyYWwAAAAAABMAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAOZGlzcHV0ZV93aW5kb3cAAAAAAAYAAAAAAAAABmV4cGlyeQAAAAAABgAAAAAAAAAKZmVlX2NvbmZpZwAAAAAH0AAAAAlGZWVDb25maWcAAAAAAAAAAAAADWZpbmFsX291dGNvbWUAAAAAAAfQAAAAB091dGNvbWUAAAAAAAAAABFoYXNfZmluYWxfb3V0Y29tZQAAAAAAAAEAAAAAAAAAC2hhc19yZXF1ZXN0AAAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAtub190b2tlbl9pZAAAAAAGAAAAAAAAAAdwb29sX2lkAAAAAAYAAAAAAAAACHF1ZXN0aW9uAAAAEAAAAAAAAAANcXVlc3Rpb25faGFzaAAAAAAAA+4AAAAgAAAAAAAAAApyZXF1ZXN0X2lkAAAAAAAGAAAAAAAAAApydWxlc19oYXNoAAAAAAPuAAAAIAAAAAAAAAAJcnVsZXNfdXJpAAAAAAAAEAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADE1hcmtldFN0YXR1cwAAAAAAAAAMeWVzX3Rva2VuX2lkAAAABg==",
        "AAAAAQAAAAAAAAAAAAAAClRyYWRlUXVvdGUAAAAAAAUAAAAAAAAACWFtb3VudF9pbgAAAAAAAAsAAAAAAAAACmFtb3VudF9vdXQAAAAAAAsAAAAAAAAAEWF2ZXJhZ2VfcHJpY2VfYnBzAAAAAAAABAAAAAAAAAADZmVlAAAAAAsAAAAAAAAABm5ldF9pbgAAAAAACw==",
        "AAAAAQAAAAAAAAAAAAAAC0NvdW5jaWxDYXNlAAAAABUAAAAAAAAACmNvbW1pdF9lbmQAAAAAAAYAAAAAAAAADGRpc3B1dGVfYm9uZAAAAAsAAAAAAAAACGRpc3B1dGVyAAAAEwAAAAAAAAAVZGlzcHV0ZXJfZXZpZGVuY2VfdXJpAAAAAAAAEAAAAAAAAAAQZGlzcHV0ZXJfb3V0Y29tZQAAB9AAAAAHT3V0Y29tZQAAAAAAAAAADWZpbmFsX291dGNvbWUAAAAAAAfQAAAAB091dGNvbWUAAAAAAAAAABFoYXNfZmluYWxfb3V0Y29tZQAAAAAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAA1pbnZhbGlkX3ZvdGVzAAAAAAAABAAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAIbm9fdm90ZXMAAAAEAAAAAAAAAA1wcm9wb3NhbF9ib25kAAAAAAAACwAAAAAAAAAIcHJvcG9zZXIAAAATAAAAAAAAABVwcm9wb3Nlcl9ldmlkZW5jZV91cmkAAAAAAAAQAAAAAAAAABBwcm9wb3Nlcl9vdXRjb21lAAAH0AAAAAdPdXRjb21lAAAAAAAAAAAKcmVxdWVzdF9pZAAAAAAABgAAAAAAAAAKcmV2ZWFsX2VuZAAAAAAABgAAAAAAAAAGc3RhdHVzAAAAAAfQAAAAEUNvdW5jaWxDYXNlU3RhdHVzAAAAAAAAAAAAABF0b3RhbF92YWxpZF92b3RlcwAAAAAAAAQAAAAAAAAADHZvdGluZ19zdGFydAAAAAYAAAAAAAAACXllc192b3RlcwAAAAAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAADE1hcmtldENvbmZpZwAAAAsAAAAAAAAAC2JvbmRfYW1vdW50AAAAAAsAAAAAAAAACGNhdGVnb3J5AAAAEAAAAAAAAAAKY29sbGF0ZXJhbAAAAAAAEwAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAA5kaXNwdXRlX3dpbmRvdwAAAAAABgAAAAAAAAAGZXhwaXJ5AAAAAAAGAAAAAAAAAApmZWVfY29uZmlnAAAAAAfQAAAACUZlZUNvbmZpZwAAAAAAAAAAAAAIcXVlc3Rpb24AAAAQAAAAAAAAAA1xdWVzdGlvbl9oYXNoAAAAAAAD7gAAACAAAAAAAAAACnJ1bGVzX2hhc2gAAAAAA+4AAAAgAAAAAAAAAAlydWxlc191cmkAAAAAAAAQ",
        "AAAAAgAAAAAAAAAAAAAADE1hcmtldFN0YXR1cwAAAAoAAAAAAAAAAAAAAAdDcmVhdGVkAAAAAAAAAAAAAAAABExpdmUAAAAAAAAAAAAAAAZQYXVzZWQAAAAAAAAAAAAAAAAADVRyYWRpbmdDbG9zZWQAAAAAAAAAAAAAAAAAABNSZXNvbHV0aW9uUmVxdWVzdGVkAAAAAAAAAAAAAAAACFByb3Bvc2VkAAAAAAAAAAAAAAAIRGlzcHV0ZWQAAAAAAAAAAAAAAA1Db3VuY2lsVm90aW5nAAAAAAAAAAAAAAAAAAAIUmVzb2x2ZWQAAAAAAAAAAAAAAAlDYW5jZWxsZWQAAAA=",
        "AAAAAgAAAAAAAAAAAAAADE9yYWNsZVN0YXR1cwAAAAYAAAAAAAAAAAAAAAROb25lAAAAAAAAAAAAAAAJUmVxdWVzdGVkAAAAAAAAAAAAAAAAAAAIUHJvcG9zZWQAAAAAAAAAAAAAAAhEaXNwdXRlZAAAAAAAAAAAAAAACUVzY2FsYXRlZAAAAAAAAAAAAAAAAAAACUZpbmFsaXplZAAAAA==",
        "AAAAAQAAAAAAAAAAAAAADk9wZW5DYXNlQ29uZmlnAAAAAAAEAAAAAAAAAA9jb21taXRfZHVyYXRpb24AAAAABgAAAAAAAAAMZGlzcHV0ZV9ib25kAAAACwAAAAAAAAANcHJvcG9zYWxfYm9uZAAAAAAAAAsAAAAAAAAAD3JldmVhbF9kdXJhdGlvbgAAAAAG",
        "AAAAAQAAAAAAAAAAAAAADlRpbWVsb2NrQWN0aW9uAAAAAAAIAAAAAAAAAAljYW5jZWxsZWQAAAAAAAABAAAAAAAAAA1leGVjdXRlX2FmdGVyAAAAAAAABgAAAAAAAAAIZXhlY3V0ZWQAAAABAAAAAAAAAApleHBpcmVzX2F0AAAAAAAGAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAEa2luZAAAB9AAAAASVGltZWxvY2tBY3Rpb25LaW5kAAAAAAAAAAAADHBheWxvYWRfaGFzaAAAA+4AAAAgAAAAAAAAAAZ0YXJnZXQAAAAAABM=",
        "AAAAAQAAAAAAAAAAAAAAD1ZhdWx0QWNjb3VudGluZwAAAAANAAAAAAAAAA5hbW1fY29sbGF0ZXJhbAAAAAAACwAAAAAAAAAaY2hpbGRfY29sbGF0ZXJhbF9kZWZhdWx0ZWQAAAAAAAsAAAAAAAAAF2NoaWxkX2NvbGxhdGVyYWxfaXNzdWVkAAAAAAsAAAAAAAAAF2NoaWxkX2NvbGxhdGVyYWxfcmVwYWlkAAAAAAsAAAAAAAAACGNvZF9mZWVzAAAACwAAAAAAAAASY29sbGF0ZXJhbF9iYWNraW5nAAAAAAALAAAAAAAAAA1kaXNwdXRlX2JvbmRzAAAAAAAACwAAAAAAAAAHbHBfZmVlcwAAAAALAAAAAAAAAA5wcm9wb3NhbF9ib25kcwAAAAAACwAAAAAAAAANcHJvdG9jb2xfZmVlcwAAAAAAAAsAAAAAAAAACHJlZGVlbWVkAAAACwAAAAAAAAAKcmVmdW5kYWJsZQAAAAAACwAAAAAAAAAPdG90YWxfZGVwb3NpdGVkAAAAAAs=",
        "AAAAAgAAAAAAAAAAAAAAEUNvdW5jaWxDYXNlU3RhdHVzAAAAAAAABgAAAAAAAAAAAAAABk9wZW5lZAAAAAAAAAAAAAAAAAALQ29tbWl0UGhhc2UAAAAAAAAAAAAAAAALUmV2ZWFsUGhhc2UAAAAAAAAAAAAAAAAPUmVhZHlUb0ZpbmFsaXplAAAAAAAAAAAAAAAACUZpbmFsaXplZAAAAAAAAAAAAAAAAAAACUNhbmNlbGxlZAAAAA==",
        "AAAAAQAAAAAAAAAAAAAAEVJlc29sdXRpb25SZXF1ZXN0AAAAAAAAFQAAAAAAAAALYm9uZF9hbW91bnQAAAAACwAAAAAAAAAUZGlzcHV0ZV9ldmlkZW5jZV91cmkAAAAQAAAAAAAAAA5kaXNwdXRlX3dpbmRvdwAAAAAABgAAAAAAAAALZGlzcHV0ZWRfYXQAAAAABgAAAAAAAAAQZGlzcHV0ZWRfb3V0Y29tZQAAB9AAAAAHT3V0Y29tZQAAAAAAAAAACGRpc3B1dGVyAAAAEwAAAAAAAAAGZXhwaXJ5AAAAAAAGAAAAAAAAAA1maW5hbF9vdXRjb21lAAAAAAAH0AAAAAdPdXRjb21lAAAAAAAAAAALaGFzX2Rpc3B1dGUAAAAAAQAAAAAAAAARaGFzX2ZpbmFsX291dGNvbWUAAAAAAAABAAAAAAAAAAxoYXNfcHJvcG9zYWwAAAABAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAVcHJvcG9zYWxfZXZpZGVuY2VfdXJpAAAAAAAAEAAAAAAAAAALcHJvcG9zZWRfYXQAAAAABgAAAAAAAAAQcHJvcG9zZWRfb3V0Y29tZQAAB9AAAAAHT3V0Y29tZQAAAAAAAAAACHByb3Bvc2VyAAAAEwAAAAAAAAANcXVlc3Rpb25faGFzaAAAAAAAA+4AAAAgAAAAAAAAAAxyZXF1ZXN0ZWRfYXQAAAAGAAAAAAAAAAlydWxlc191cmkAAAAAAAAQAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAMT3JhY2xlU3RhdHVz",
        "AAAAAgAAAAAAAAAAAAAAElRpbWVsb2NrQWN0aW9uS2luZAAAAAAACAAAAAAAAAAAAAAACUZlZUNvbmZpZwAAAAAAAAAAAAAAAAAACFRyZWFzdXJ5AAAAAAAAAAAAAAATU3VwcG9ydGVkQ29sbGF0ZXJhbAAAAAAAAAAAAAAAAAdDcmVhdG9yAAAAAAAAAAAAAAAADUNvdW5jaWxNZW1iZXIAAAAAAAAAAAAAAAAAAA1Nb2R1bGVBZGRyZXNzAAAAAAAAAAAAAAAAAAAFUGF1c2UAAAAAAAAAAAAAAAAAAAdVcGdyYWRlAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    case: this.txFromJSON<Result<CouncilCase>>,
        pause: this.txFromJSON<Result<void>>,
        set_role: this.txFromJSON<Result<void>>,
        open_case: this.txFromJSON<Result<u64>>,
        set_member: this.txFromJSON<Result<void>>,
        commit_vote: this.txFromJSON<Result<void>>,
        reveal_vote: this.txFromJSON<Result<void>>,
        claim_reward: this.txFromJSON<Result<boolean>>,
        finalize_case: this.txFromJSON<Result<Outcome>>,
        vote_commitment: this.txFromJSON<Buffer>,
        case_for_request: this.txFromJSON<Result<u64>>,
        finalize_and_report_case: this.txFromJSON<Result<Outcome>>
  }
}