import { describe, expect, it } from "vitest";
import { effectiveChannels } from "@/domain/notifications/routing";

describe("notification routing — SRS §6.13 + FR-NOT-04", () => {
  it("uses default channels when no opt-outs", () => {
    const channels = effectiveChannels("DAILY_REPORT_READY", { optedOut: [] });
    expect(channels).toContain("WHATSAPP");
    expect(channels).toContain("EMAIL");
    expect(channels).toContain("IN_APP");
  });

  it("respects opt-out for non-critical events", () => {
    const channels = effectiveChannels("DAILY_REPORT_READY", { optedOut: ["WHATSAPP"] });
    expect(channels).not.toContain("WHATSAPP");
    expect(channels).toContain("EMAIL");
  });

  it("ignores opt-out for critical events: PAYMENT_OVERDUE", () => {
    const channels = effectiveChannels("PAYMENT_OVERDUE", { optedOut: ["WHATSAPP", "EMAIL"] });
    expect(channels).toContain("WHATSAPP");
    expect(channels).toContain("EMAIL");
  });

  it("ignores opt-out for critical events: MEDICAL_DOC_EXPIRING", () => {
    const channels = effectiveChannels("MEDICAL_DOC_EXPIRING", { optedOut: ["WHATSAPP"] });
    expect(channels).toContain("WHATSAPP");
  });

  it("PAYMENT_REMINDER is non-critical and respects opt-out", () => {
    const channels = effectiveChannels("PAYMENT_REMINDER", { optedOut: ["EMAIL"] });
    expect(channels).not.toContain("EMAIL");
  });

  it("candidate override narrows the channel set", () => {
    const channels = effectiveChannels("DAILY_REPORT_READY", { optedOut: [] }, ["EMAIL"]);
    expect(channels).toEqual(["EMAIL"]);
  });
});
