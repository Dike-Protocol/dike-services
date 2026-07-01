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





export type DataKey = {tag: "Admin", values: void} | {tag: "Role", values: readonly [string]} | {tag: "Treasury", values: void} | {tag: "Accounting", values: readonly [u64]} | {tag: "UserDeposit", values: readonly [u64, string]} | {tag: "RootStake", values: readonly [u64, string, Outcome]} | {tag: "ChildCollateralUsedByOutcome", values: readonly [u64, string, Outcome]} | {tag: "ChildCollateralUsed", values: readonly [u64, string]} | {tag: "ChildParent", values: readonly [u64, string]} | {tag: "ChildParentOutcome", values: readonly [u64, string]} | {tag: "ChildLoan", values: readonly [u64, u64, string]} | {tag: "ChildLoanByOutcome", values: readonly [u64, Outcome, u64, Outcome, string]} | {tag: "ChildDebt", values: readonly [u64, string]} | {tag: "ParentDebt", values: readonly [u64, string, Outcome]} | {tag: "Bond", values: readonly [u64, string, boolean]} | {tag: "BondToken", values: readonly [u64, string, boolean]} | {tag: "BondMarket", values: readonly [u64, string, boolean]} | {tag: "Redeemed", values: readonly [u64, string, Outcome]} | {tag: "Paused", values: void};












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
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pause: ({paused}: {paused: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a redeem transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  redeem: ({token, user, market_id, final_outcome, redeemed_outcome, amount}: {token: string, user: string, market_id: u64, final_outcome: Outcome, redeemed_outcome: Outcome, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a redeemed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  redeemed: ({market_id, user, outcome}: {market_id: u64, user: string, outcome: Outcome}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a set_role transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_role: ({role, module}: {role: string, module: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a lock_bond transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  lock_bond: ({token, user, request_id, market_id, amount, is_dispute}: {token: string, user: string, request_id: u64, market_id: u64, amount: i128, is_dispute: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_admin: ({admin}: {admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a accounting transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  accounting: ({market_id}: {market_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<VaultAccounting>>

  /**
   * Construct and simulate a child_debt transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  child_debt: ({child_market_id, user}: {child_market_id: u64, user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a root_stake transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  root_stake: ({market_id, user, outcome}: {market_id: u64, user: string, outcome: Outcome}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a slash_bond transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  slash_bond: ({token, user, request_id, amount, is_dispute, recipient}: {token: string, user: string, request_id: u64, amount: i128, is_dispute: boolean, recipient: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a collect_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  collect_fee: ({market_id, lp_fee, protocol_fee, cod_fee}: {market_id: u64, lp_fee: i128, protocol_fee: i128, cod_fee: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a parent_debt transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  parent_debt: ({parent_market_id, user, outcome}: {parent_market_id: u64, user: string, outcome: Outcome}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a child_parent transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  child_parent: ({child_market_id, user}: {child_market_id: u64, user: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a release_bond transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  release_bond: ({token, user, request_id, amount, is_dispute}: {token: string, user: string, request_id: u64, amount: i128, is_dispute: boolean}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_treasury transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_treasury: ({treasury}: {treasury: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a user_deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  user_deposit: ({market_id, user}: {market_id: u64, user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a claim_lp_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  claim_lp_fees: ({token, market_id, lp, amount}: {token: string, market_id: u64, lp: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a redeem_resolved transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  redeem_resolved: ({token, user, market_id, redeemed_outcome, amount}: {token: string, user: string, market_id: u64, redeemed_outcome: Outcome, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a redeem_cancelled transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  redeem_cancelled: ({token, user, market_id, redeemed_outcome, amount}: {token: string, user: string, market_id: u64, redeemed_outcome: Outcome, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a release_on_merge transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  release_on_merge: ({token, user, market_id, amount}: {token: string, user: string, market_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a record_cash_stake transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  record_cash_stake: ({user, market_id, outcome, collateral_in, tokens_out}: {user: string, market_id: u64, outcome: Outcome, collateral_in: i128, tokens_out: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a deposit_for_market transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  deposit_for_market: ({token, user, market_id, amount}: {token: string, user: string, market_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a sweep_protocol_fees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  sweep_protocol_fees: ({token, market_id}: {token: string, market_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a child_parent_outcome transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  child_parent_outcome: ({child_market_id, user}: {child_market_id: u64, user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Outcome>>

  /**
   * Construct and simulate a release_trade_payout transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  release_trade_payout: ({token, user, market_id, outcome, tokens_sold, payout}: {token: string, user: string, market_id: u64, outcome: Outcome, tokens_sold: i128, payout: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a child_collateral_loan transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  child_collateral_loan: ({parent_market_id, child_market_id, user}: {parent_market_id: u64, child_market_id: u64, user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a child_collateral_used transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  child_collateral_used: ({parent_market_id, user}: {parent_market_id: u64, user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a fund_child_prediction transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  fund_child_prediction: ({user, parent_market_id, child_market_id, amount}: {user: string, parent_market_id: u64, child_market_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a child_loan_for_outcome transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  child_loan_for_outcome: ({parent_market_id, parent_outcome, child_market_id, child_outcome, user}: {parent_market_id: u64, parent_outcome: Outcome, child_market_id: u64, child_outcome: Outcome, user: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a child_used_for_outcome transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  child_used_for_outcome: ({parent_market_id, user, outcome}: {parent_market_id: u64, user: string, outcome: Outcome}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a repay_child_collateral transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  repay_child_collateral: ({token, user, parent_market_id, child_market_id, amount}: {token: string, user: string, parent_market_id: u64, child_market_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a child_avail_for_outcome transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  child_avail_for_outcome: ({parent_market_id, user, outcome}: {parent_market_id: u64, user: string, outcome: Outcome}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a child_collateral_available transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  child_collateral_available: ({parent_market_id, user}: {parent_market_id: u64, user: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a open_child_credit_for_trade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  open_child_credit_for_trade: ({user, parent_market_id, parent_outcome, child_market_id, child_outcome, amount}: {user: string, parent_market_id: u64, parent_outcome: Outcome, child_market_id: u64, child_outcome: Outcome, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a assert_position_transfer_allowed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  assert_position_transfer_allowed: ({from, market_id, outcome, amount}: {from: string, market_id: u64, outcome: Outcome, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, treasury}: {admin: string, treasury: string},
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
    return ContractClient.deploy({admin, treasury}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABQAAAAAAAAAAAAAABlBhdXNlZAAAAAAAAQAAAAVwYXVzZQAAAAAAAAEAAAAAAAAABnBhdXNlZAAAAAAAAQAAAAAAAAAA",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAEwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAAAAAAAEUm9sZQAAAAEAAAARAAAAAAAAAAAAAAAIVHJlYXN1cnkAAAABAAAAAAAAAApBY2NvdW50aW5nAAAAAAABAAAABgAAAAEAAAAAAAAAC1VzZXJEZXBvc2l0AAAAAAIAAAAGAAAAEwAAAAEAAAAAAAAACVJvb3RTdGFrZQAAAAAAAAMAAAAGAAAAEwAAB9AAAAAHT3V0Y29tZQAAAAABAAAAAAAAABxDaGlsZENvbGxhdGVyYWxVc2VkQnlPdXRjb21lAAAAAwAAAAYAAAATAAAH0AAAAAdPdXRjb21lAAAAAAEAAAAAAAAAE0NoaWxkQ29sbGF0ZXJhbFVzZWQAAAAAAgAAAAYAAAATAAAAAQAAAAAAAAALQ2hpbGRQYXJlbnQAAAAAAgAAAAYAAAATAAAAAQAAAAAAAAASQ2hpbGRQYXJlbnRPdXRjb21lAAAAAAACAAAABgAAABMAAAABAAAAAAAAAAlDaGlsZExvYW4AAAAAAAADAAAABgAAAAYAAAATAAAAAQAAAAAAAAASQ2hpbGRMb2FuQnlPdXRjb21lAAAAAAAFAAAABgAAB9AAAAAHT3V0Y29tZQAAAAAGAAAH0AAAAAdPdXRjb21lAAAAABMAAAABAAAAAAAAAAlDaGlsZERlYnQAAAAAAAACAAAABgAAABMAAAABAAAAAAAAAApQYXJlbnREZWJ0AAAAAAADAAAABgAAABMAAAfQAAAAB091dGNvbWUAAAAAAQAAAAAAAAAEQm9uZAAAAAMAAAAGAAAAEwAAAAEAAAABAAAAAAAAAAlCb25kVG9rZW4AAAAAAAADAAAABgAAABMAAAABAAAAAQAAAAAAAAAKQm9uZE1hcmtldAAAAAAAAwAAAAYAAAATAAAAAQAAAAEAAAAAAAAACFJlZGVlbWVkAAAAAwAAAAYAAAATAAAH0AAAAAdPdXRjb21lAAAAAAAAAAAAAAAABlBhdXNlZAAA",
        "AAAABQAAAAAAAAAAAAAAB1JvbGVTZXQAAAAAAQAAAARyb2xlAAAAAgAAAAAAAAAEcm9sZQAAABEAAAABAAAAAAAAAAZtb2R1bGUAAAAAABMAAAAAAAAAAA==",
        "AAAABQAAAAAAAAAAAAAACEFkbWluU2V0AAAAAQAAAAVhZG1pbgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAA",
        "AAAABQAAAAAAAAAAAAAACFJlZGVlbWVkAAAAAQAAAAZyZWRlZW0AAAAAAAQAAAAAAAAACW1hcmtldF9pZAAAAAAAAAYAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAAAAAAAB291dGNvbWUAAAAH0AAAAAdPdXRjb21lAAAAAAAAAAAAAAAABnBheW91dAAAAAAACwAAAAAAAAAB",
        "AAAABQAAAAAAAAAAAAAACkJvbmRMb2NrZWQAAAAAAAEAAAAEYm9uZAAAAAQAAAAAAAAACnJlcXVlc3RfaWQAAAAAAAYAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAAAAAACmlzX2Rpc3B1dGUAAAAAAAEAAAAAAAAAAQ==",
        "AAAABQAAAAAAAAAAAAAAC1RyZWFzdXJ5U2V0AAAAAAEAAAAFdHJlYXMAAAAAAAABAAAAAAAAAAh0cmVhc3VyeQAAABMAAAAAAAAAAA==",
        "AAAABQAAAAAAAAAAAAAADEJvbmRSZWxlYXNlZAAAAAEAAAAIYm9uZF9yZWwAAAADAAAAAAAAAApyZXF1ZXN0X2lkAAAAAAAGAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAA==",
        "AAAABQAAAAAAAAAAAAAADE1lcmdlUmVsZWFzZQAAAAEAAAAHcmVsZWFzZQAAAAADAAAAAAAAAAltYXJrZXRfaWQAAAAAAAAGAAAAAQAAAAAAAAAEdXNlcgAAABMAAAABAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAFcGF1c2UAAAAAAAABAAAAAAAAAAZwYXVzZWQAAAAAAAEAAAABAAAD6QAAA+0AAAAAAAAH0AAAAAlEaWtlRXJyb3IAAAA=",
        "AAAABQAAAAAAAAAAAAAADUZlZXNDb2xsZWN0ZWQAAAAAAAABAAAAA2ZlZQAAAAAEAAAAAAAAAAltYXJrZXRfaWQAAAAAAAAGAAAAAQAAAAAAAAAGbHBfZmVlAAAAAAALAAAAAAAAAAAAAAAMcHJvdG9jb2xfZmVlAAAACwAAAAAAAAAAAAAAB2NvZF9mZWUAAAAACwAAAAAAAAAB",
        "AAAABQAAAAAAAAAAAAAADU1hcmtldERlcG9zaXQAAAAAAAABAAAAB2RlcG9zaXQAAAAAAwAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAEAAAAAAAAABHVzZXIAAAATAAAAAQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAA=",
        "AAAAAAAAAAAAAAAGcmVkZWVtAAAAAAAGAAAAAAAAAAV0b2tlbgAAAAAAABMAAAAAAAAABHVzZXIAAAATAAAAAAAAAAltYXJrZXRfaWQAAAAAAAAGAAAAAAAAAA1maW5hbF9vdXRjb21lAAAAAAAH0AAAAAdPdXRjb21lAAAAAAAAAAAQcmVkZWVtZWRfb3V0Y29tZQAAB9AAAAAHT3V0Y29tZQAAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAACwAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAAIcmVkZWVtZWQAAAADAAAAAAAAAAltYXJrZXRfaWQAAAAAAAAGAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAHb3V0Y29tZQAAAAfQAAAAB091dGNvbWUAAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAIc2V0X3JvbGUAAAACAAAAAAAAAARyb2xlAAAAEQAAAAAAAAAGbW9kdWxlAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAAJbG9ja19ib25kAAAAAAAABgAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAKcmVxdWVzdF9pZAAAAAAABgAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAppc19kaXNwdXRlAAAAAAABAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAAKYWNjb3VudGluZwAAAAAAAQAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAEAAAfQAAAAD1ZhdWx0QWNjb3VudGluZwA=",
        "AAAAAAAAAAAAAAAKY2hpbGRfZGVidAAAAAAAAgAAAAAAAAAPY2hpbGRfbWFya2V0X2lkAAAAAAYAAAAAAAAABHVzZXIAAAATAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAKcm9vdF9zdGFrZQAAAAAAAwAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAEdXNlcgAAABMAAAAAAAAAB291dGNvbWUAAAAH0AAAAAdPdXRjb21lAAAAAAEAAAAL",
        "AAAAAAAAAAAAAAAKc2xhc2hfYm9uZAAAAAAABgAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAKcmVxdWVzdF9pZAAAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAppc19kaXNwdXRlAAAAAAABAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "AAAAAAAAAAAAAAALY29sbGVjdF9mZWUAAAAABAAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAGbHBfZmVlAAAAAAALAAAAAAAAAAxwcm90b2NvbF9mZWUAAAALAAAAAAAAAAdjb2RfZmVlAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAAlEaWtlRXJyb3IAAAA=",
        "AAAAAAAAAAAAAAALcGFyZW50X2RlYnQAAAAAAwAAAAAAAAAQcGFyZW50X21hcmtldF9pZAAAAAYAAAAAAAAABHVzZXIAAAATAAAAAAAAAAdvdXRjb21lAAAAB9AAAAAHT3V0Y29tZQAAAAABAAAACw==",
        "AAAAAAAAAAAAAAAMY2hpbGRfcGFyZW50AAAAAgAAAAAAAAAPY2hpbGRfbWFya2V0X2lkAAAAAAYAAAAAAAAABHVzZXIAAAATAAAAAQAAAAY=",
        "AAAAAAAAAAAAAAAMcmVsZWFzZV9ib25kAAAABQAAAAAAAAAFdG9rZW4AAAAAAAATAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAKcmVxdWVzdF9pZAAAAAAABgAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAppc19kaXNwdXRlAAAAAAABAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAJRGlrZUVycm9yAAAA",
        "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",
        "AAAAAgAAAAAAAAAAAAAAB091dGNvbWUAAAAAAwAAAAAAAAAAAAAAA1llcwAAAAAAAAAAAAAAAAJObwAAAAAAAAAAAAAAAAAHSW52YWxpZAA=",
        "AAAAAQAAAAAAAAAAAAAACFBvb2xEYXRhAAAACgAAAAAAAAAUYWNjdW11bGF0ZWRfY29kX2ZlZXMAAAALAAAAAAAAABNhY2N1bXVsYXRlZF9scF9mZWVzAAAAAAsAAAAAAAAAGWFjY3VtdWxhdGVkX3Byb3RvY29sX2ZlZXMAAAAAAAALAAAAAAAAABRmZWVfcGVyX3NoYXJlX3NjYWxlZAAAAAsAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAARsaXZlAAAAAQAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAKbm9fcmVzZXJ2ZQAAAAAACwAAAAAAAAAPdG90YWxfbHBfc2hhcmVzAAAAAAsAAAAAAAAAC3llc19yZXNlcnZlAAAAAAs=",
        "AAAABAAAAAAAAAAAAAAACURpa2VFcnJvcgAAAAAAACMAAAAAAAAAEkFscmVhZHlJbml0aWFsaXplZAAAAAAAAQAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAIAAAAAAAAADFVuYXV0aG9yaXplZAAAAAMAAAAAAAAADUludmFsaWRBbW91bnQAAAAAAAAEAAAAAAAAAAxJbnZhbGlkSW5wdXQAAAAFAAAAAAAAAA1JbnZhbGlkU3RhdHVzAAAAAAAABgAAAAAAAAARSW52YWxpZFRyYW5zaXRpb24AAAAAAAAHAAAAAAAAAAxNYXJrZXRFeGlzdHMAAAAIAAAAAAAAAA5NYXJrZXROb3RGb3VuZAAAAAAACQAAAAAAAAAMUG9vbE5vdEZvdW5kAAAACgAAAAAAAAAPUmVxdWVzdE5vdEZvdW5kAAAAAAsAAAAAAAAADENhc2VOb3RGb3VuZAAAAAwAAAAAAAAAD0FscmVhZHlSZXNvbHZlZAAAAAANAAAAAAAAAA9BbHJlYWR5UmVkZWVtZWQAAAAADgAAAAAAAAATSW5zdWZmaWNpZW50QmFsYW5jZQAAAAAPAAAAAAAAABZJbnN1ZmZpY2llbnRDb2xsYXRlcmFsAAAAAAAQAAAAAAAAABBTbGlwcGFnZUV4Y2VlZGVkAAAAEQAAAAAAAAAPRGVhZGxpbmVFeHBpcmVkAAAAABIAAAAAAAAACk5vdEV4cGlyZWQAAAAAABMAAAAAAAAAEURpc3B1dGVXaW5kb3dPcGVuAAAAAAAAFAAAAAAAAAATRGlzcHV0ZVdpbmRvd0Nsb3NlZAAAAAAVAAAAAAAAABBFdmlkZW5jZVJlcXVpcmVkAAAAFgAAAAAAAAAPQWxyZWFkeURpc3B1dGVkAAAAABcAAAAAAAAADUludmFsaWRSZXZlYWwAAAAAAAAYAAAAAAAAABRWb3RlQWxyZWFkeUNvbW1pdHRlZAAAABkAAAAAAAAAEFZvdGVOb3RDb21taXR0ZWQAAAAaAAAAAAAAAAhUb29FYXJseQAAABsAAAAAAAAAEFRpbWVsb2NrTm90UmVhZHkAAAAcAAAAAAAAAA5BY3Rpb25Db25zdW1lZAAAAAAAHQAAAAAAAAAVVW5zdXBwb3J0ZWRDb2xsYXRlcmFsAAAAAAAAHgAAAAAAAAASQ3JlYXRvck5vdEFwcHJvdmVkAAAAAAAfAAAAAAAAAA9Bcml0aG1ldGljRXJyb3IAAAAAIAAAAAAAAAASQ2hhaW5EZXB0aEV4Y2VlZGVkAAAAAAAhAAAAAAAAABxDaGlsZENvbGxhdGVyYWxMaW1pdEV4Y2VlZGVkAAAAIgAAAAAAAAASRW5jdW1iZXJlZFBvc2l0aW9uAAAAAAAj",
        "AAAAAQAAAAAAAAAAAAAACUZlZUNvbmZpZwAAAAAAAAYAAAAAAAAAEWNvZF9mZWVfc2hhcmVfYnBzAAAAAAAABAAAAAAAAAAOY291bmNpbF9yZXdhcmQAAAAAAAsAAAAAAAAADGNyZWF0aW9uX2ZlZQAAAAsAAAAAAAAAEGxwX2ZlZV9zaGFyZV9icHMAAAAEAAAAAAAAAA90cmFkaW5nX2ZlZV9icHMAAAAABAAAAAAAAAAWdHJlYXN1cnlfZmVlX3NoYXJlX2JwcwAAAAAABA==",
        "AAAAAQAAAAAAAAAAAAAACk1hcmtldERhdGEAAAAAABQAAAAAAAAAC2JvbmRfYW1vdW50AAAAAAsAAAAAAAAACmNvbGxhdGVyYWwAAAAAABMAAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAOZGlzcHV0ZV93aW5kb3cAAAAAAAYAAAAAAAAABmV4cGlyeQAAAAAABgAAAAAAAAAKZmVlX2NvbmZpZwAAAAAH0AAAAAlGZWVDb25maWcAAAAAAAAAAAAADWZpbmFsX291dGNvbWUAAAAAAAfQAAAAB091dGNvbWUAAAAAAAAAABFoYXNfZmluYWxfb3V0Y29tZQAAAAAAAAEAAAAAAAAAC2hhc19yZXF1ZXN0AAAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAtub190b2tlbl9pZAAAAAAGAAAAAAAAAAdwb29sX2lkAAAAAAYAAAAAAAAACHF1ZXN0aW9uAAAAEAAAAAAAAAANcXVlc3Rpb25faGFzaAAAAAAAA+4AAAAgAAAAAAAAAApyZXF1ZXN0X2lkAAAAAAAGAAAAAAAAAApydWxlc19oYXNoAAAAAAPuAAAAIAAAAAAAAAAJcnVsZXNfdXJpAAAAAAAAEAAAAAAAAAAGc3RhdHVzAAAAAAfQAAAADE1hcmtldFN0YXR1cwAAAAAAAAAMeWVzX3Rva2VuX2lkAAAABg==",
        "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",
        "AAAAAQAAAAAAAAAAAAAAD1ZhdWx0QWNjb3VudGluZwAAAAANAAAAAAAAAA5hbW1fY29sbGF0ZXJhbAAAAAAACwAAAAAAAAAaY2hpbGRfY29sbGF0ZXJhbF9kZWZhdWx0ZWQAAAAAAAsAAAAAAAAAF2NoaWxkX2NvbGxhdGVyYWxfaXNzdWVkAAAAAAsAAAAAAAAAF2NoaWxkX2NvbGxhdGVyYWxfcmVwYWlkAAAAAAsAAAAAAAAACGNvZF9mZWVzAAAACwAAAAAAAAASY29sbGF0ZXJhbF9iYWNraW5nAAAAAAALAAAAAAAAAA1kaXNwdXRlX2JvbmRzAAAAAAAACwAAAAAAAAAHbHBfZmVlcwAAAAALAAAAAAAAAA5wcm9wb3NhbF9ib25kcwAAAAAACwAAAAAAAAANcHJvdG9jb2xfZmVlcwAAAAAAAAsAAAAAAAAACHJlZGVlbWVkAAAACwAAAAAAAAAKcmVmdW5kYWJsZQAAAAAACwAAAAAAAAAPdG90YWxfZGVwb3NpdGVkAAAAAAs=",
        "AAAAAgAAAAAAAAAAAAAAEUNvdW5jaWxDYXNlU3RhdHVzAAAAAAAABgAAAAAAAAAAAAAABk9wZW5lZAAAAAAAAAAAAAAAAAALQ29tbWl0UGhhc2UAAAAAAAAAAAAAAAALUmV2ZWFsUGhhc2UAAAAAAAAAAAAAAAAPUmVhZHlUb0ZpbmFsaXplAAAAAAAAAAAAAAAACUZpbmFsaXplZAAAAAAAAAAAAAAAAAAACUNhbmNlbGxlZAAAAA==",
        "AAAAAQAAAAAAAAAAAAAAEVJlc29sdXRpb25SZXF1ZXN0AAAAAAAAFQAAAAAAAAALYm9uZF9hbW91bnQAAAAACwAAAAAAAAAUZGlzcHV0ZV9ldmlkZW5jZV91cmkAAAAQAAAAAAAAAA5kaXNwdXRlX3dpbmRvdwAAAAAABgAAAAAAAAALZGlzcHV0ZWRfYXQAAAAABgAAAAAAAAAQZGlzcHV0ZWRfb3V0Y29tZQAAB9AAAAAHT3V0Y29tZQAAAAAAAAAACGRpc3B1dGVyAAAAEwAAAAAAAAAGZXhwaXJ5AAAAAAAGAAAAAAAAAA1maW5hbF9vdXRjb21lAAAAAAAH0AAAAAdPdXRjb21lAAAAAAAAAAALaGFzX2Rpc3B1dGUAAAAAAQAAAAAAAAARaGFzX2ZpbmFsX291dGNvbWUAAAAAAAABAAAAAAAAAAxoYXNfcHJvcG9zYWwAAAABAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAJbWFya2V0X2lkAAAAAAAABgAAAAAAAAAVcHJvcG9zYWxfZXZpZGVuY2VfdXJpAAAAAAAAEAAAAAAAAAALcHJvcG9zZWRfYXQAAAAABgAAAAAAAAAQcHJvcG9zZWRfb3V0Y29tZQAAB9AAAAAHT3V0Y29tZQAAAAAAAAAACHByb3Bvc2VyAAAAEwAAAAAAAAANcXVlc3Rpb25faGFzaAAAAAAAA+4AAAAgAAAAAAAAAAxyZXF1ZXN0ZWRfYXQAAAAGAAAAAAAAAAlydWxlc191cmkAAAAAAAAQAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAAMT3JhY2xlU3RhdHVz",
        "AAAAAgAAAAAAAAAAAAAAElRpbWVsb2NrQWN0aW9uS2luZAAAAAAACAAAAAAAAAAAAAAACUZlZUNvbmZpZwAAAAAAAAAAAAAAAAAACFRyZWFzdXJ5AAAAAAAAAAAAAAATU3VwcG9ydGVkQ29sbGF0ZXJhbAAAAAAAAAAAAAAAAAdDcmVhdG9yAAAAAAAAAAAAAAAADUNvdW5jaWxNZW1iZXIAAAAAAAAAAAAAAAAAAA1Nb2R1bGVBZGRyZXNzAAAAAAAAAAAAAAAAAAAFUGF1c2UAAAAAAAAAAAAAAAAAAAdVcGdyYWRlAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    pause: this.txFromJSON<Result<void>>,
        redeem: this.txFromJSON<Result<i128>>,
        redeemed: this.txFromJSON<i128>,
        set_role: this.txFromJSON<Result<void>>,
        lock_bond: this.txFromJSON<Result<void>>,
        set_admin: this.txFromJSON<Result<void>>,
        accounting: this.txFromJSON<VaultAccounting>,
        child_debt: this.txFromJSON<i128>,
        root_stake: this.txFromJSON<i128>,
        slash_bond: this.txFromJSON<Result<void>>,
        collect_fee: this.txFromJSON<Result<void>>,
        parent_debt: this.txFromJSON<i128>,
        child_parent: this.txFromJSON<u64>,
        release_bond: this.txFromJSON<Result<void>>,
        set_treasury: this.txFromJSON<Result<void>>,
        user_deposit: this.txFromJSON<i128>,
        claim_lp_fees: this.txFromJSON<Result<void>>,
        redeem_resolved: this.txFromJSON<Result<i128>>,
        redeem_cancelled: this.txFromJSON<Result<i128>>,
        release_on_merge: this.txFromJSON<Result<void>>,
        record_cash_stake: this.txFromJSON<Result<void>>,
        deposit_for_market: this.txFromJSON<Result<void>>,
        sweep_protocol_fees: this.txFromJSON<Result<i128>>,
        child_parent_outcome: this.txFromJSON<Outcome>,
        release_trade_payout: this.txFromJSON<Result<void>>,
        child_collateral_loan: this.txFromJSON<i128>,
        child_collateral_used: this.txFromJSON<i128>,
        fund_child_prediction: this.txFromJSON<Result<void>>,
        child_loan_for_outcome: this.txFromJSON<i128>,
        child_used_for_outcome: this.txFromJSON<i128>,
        repay_child_collateral: this.txFromJSON<Result<void>>,
        child_avail_for_outcome: this.txFromJSON<Result<i128>>,
        child_collateral_available: this.txFromJSON<Result<i128>>,
        open_child_credit_for_trade: this.txFromJSON<Result<void>>,
        assert_position_transfer_allowed: this.txFromJSON<Result<void>>
  }
}