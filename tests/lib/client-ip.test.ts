import { describe, expect, it } from "vitest";
import { clientIp } from "@/lib/client-ip";

function makeReq(headers: Record<string, string>) {
  return new Request("http://example.com/", { headers });
}

describe("clientIp extractor", () => {
  it("prefers x-forwarded-for first IP when set", () => {
    expect(
      clientIp(makeReq({ "x-forwarded-for": "203.0.113.1, 10.0.0.1, 10.0.0.2" })),
    ).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(makeReq({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
  });

  it("falls back to cf-connecting-ip", () => {
    expect(clientIp(makeReq({ "cf-connecting-ip": "192.0.2.99" }))).toBe("192.0.2.99");
  });

  it("returns 'unknown' when no recognized header", () => {
    expect(clientIp(makeReq({}))).toBe("unknown");
  });

  it("trims whitespace from x-forwarded-for entries", () => {
    expect(clientIp(makeReq({ "x-forwarded-for": "   203.0.113.4   " }))).toBe("203.0.113.4");
  });
});
