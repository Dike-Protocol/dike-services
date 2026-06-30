import { describe, expect, it } from "vitest";
import { parseMarketId, parseMarketListQuery, RequestValidationError } from "./request-validation.js";

describe("request validation", () => {
  it("parses market list pagination defaults and filters", () => {
    expect(parseMarketListQuery({
      status: "Live",
      creator: "GCREATOR",
      limit: "25",
      cursor: "10",
    })).toEqual({
      status: "Live",
      creator: "GCREATOR",
      collateral: undefined,
      limit: 25,
      cursor: 10,
    });
  });

  it("rejects invalid market list numeric parameters", () => {
    expect(() => parseMarketListQuery({ limit: "0" })).toThrow(RequestValidationError);
    expect(() => parseMarketListQuery({ limit: "101" })).toThrow(RequestValidationError);
    expect(() => parseMarketListQuery({ cursor: "-1" })).toThrow(RequestValidationError);
    expect(() => parseMarketListQuery({ cursor: "NaN" })).toThrow(RequestValidationError);
  });

  it("parses and rejects market ids", () => {
    expect(parseMarketId("0")).toBe(0);
    expect(parseMarketId("42")).toBe(42);
    expect(() => parseMarketId("1.5")).toThrow(RequestValidationError);
    expect(() => parseMarketId("-1")).toThrow(RequestValidationError);
    expect(() => parseMarketId("abc")).toThrow(RequestValidationError);
  });
});
