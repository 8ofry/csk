import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { hashToken } from "@/application/api-tokens/service";

describe("API token hashing", () => {
  it("is SHA-256 hex of the raw value", () => {
    const raw = "abc123";
    const expected = crypto.createHash("sha256").update(raw).digest("hex");
    expect(hashToken(raw)).toBe(expected);
  });

  it("produces a 64-char hex digest for any input", () => {
    expect(hashToken("a")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken("a".repeat(1000))).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic", () => {
    expect(hashToken("xyz")).toBe(hashToken("xyz"));
  });

  it("changes when input changes", () => {
    expect(hashToken("xyz")).not.toBe(hashToken("xyzz"));
  });
});
