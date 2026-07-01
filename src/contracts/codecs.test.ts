import { describe, expect, it } from "vitest";
import { normalizeContractValue } from "./codecs.js";

describe("normalizeContractValue", () => {
  it("serializes Date instances to ISO strings instead of {}", () => {
    const date = new Date("2026-07-01T19:22:50.722Z");
    expect(normalizeContractValue(date)).toBe("2026-07-01T19:22:50.722Z");
  });

  it("serializes Date fields nested in objects and arrays", () => {
    const date = new Date("2026-07-01T19:22:50.722Z");
    expect(normalizeContractValue({ updated_at: date })).toEqual({
      updated_at: "2026-07-01T19:22:50.722Z",
    });
    expect(normalizeContractValue([{ updated_at: date }])).toEqual([
      { updated_at: "2026-07-01T19:22:50.722Z" },
    ]);
  });

  it("still converts bigint and Buffer as before", () => {
    expect(normalizeContractValue(10n)).toBe("10");
    expect(normalizeContractValue(Buffer.from("ab", "hex"))).toBe("ab");
  });
});
