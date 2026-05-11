import { describe, expect, it } from "vitest";
import {
  LevelProgressionError,
  nextLevel,
  resolvePassedLevel,
} from "@/domain/belts/progression";

describe("belt level progression — FR-BLT-04", () => {
  describe("nextLevel", () => {
    it("null/undefined → A (newbie progression)", () => {
      expect(nextLevel(null)).toBe("A");
      expect(nextLevel(undefined)).toBe("A");
    });
    it("N → A", () => {
      expect(nextLevel("N")).toBe("A");
    });
    it("A → B → C", () => {
      expect(nextLevel("A")).toBe("B");
      expect(nextLevel("B")).toBe("C");
    });
    it("C is terminal", () => {
      expect(nextLevel("C")).toBeNull();
    });
  });

  describe("resolvePassedLevel", () => {
    it("auto-resolves when no proposed level", () => {
      expect(resolvePassedLevel("A")).toBe("B");
      expect(resolvePassedLevel(null)).toBe("A");
    });

    it("accepts a proposed level matching natural next", () => {
      expect(resolvePassedLevel("A", "B")).toBe("B");
    });

    it("refuses to skip levels", () => {
      expect(() => resolvePassedLevel("N", "C")).toThrow(LevelProgressionError);
      expect(() => resolvePassedLevel(null, "B")).toThrow(LevelProgressionError);
    });

    it("refuses a non-progressing or backward proposal", () => {
      expect(() => resolvePassedLevel("B", "A")).toThrow(LevelProgressionError);
      expect(() => resolvePassedLevel("B", "B")).toThrow(LevelProgressionError);
    });

    it("refuses promotion above C", () => {
      expect(() => resolvePassedLevel("C")).toThrow(LevelProgressionError);
    });
  });
});
