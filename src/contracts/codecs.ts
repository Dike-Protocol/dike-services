import * as StellarSdk from "@stellar/stellar-sdk";
import type { Api } from "@stellar/stellar-sdk/rpc";

export function scValToNative(value: StellarSdk.xdr.ScVal | string) {
  const scVal =
    typeof value === "string" ? StellarSdk.xdr.ScVal.fromXDR(value, "base64") : value;
  return StellarSdk.scValToNative(scVal);
}

export function decodeRawEvent(event: Api.RawEventResponse) {
  const topicValues = (event.topic ?? []).map((value) => scValToNative(value));
  const payload = scValToNative(event.value);
  return {
    topicValues,
    payload,
    topic: String(topicValues[0] ?? "unknown"),
  };
}

export function normalizeContractValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Buffer.isBuffer(value)) {
    return value.toString("hex");
  }
  if (Array.isArray(value)) {
    return value.map(normalizeContractValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalizeContractValue(nested)]),
    );
  }
  return value;
}

export function jsonReplacer(_: string, value: unknown) {
  return normalizeContractValue(value);
}
