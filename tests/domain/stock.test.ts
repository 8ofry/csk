import { describe, expect, it } from "vitest";
import { applySale, gross, isLowStock, profit, StockError } from "@/domain/merchandise/stock";

describe("merchandise stock — FR-MRC-02..04", () => {
  it("applySale decrements stock", () => {
    const next = applySale({ stockLevel: 10, lowStockThreshold: 3 }, 2);
    expect(next.stockLevel).toBe(8);
  });

  it("rejects sale larger than stock", () => {
    expect(() => applySale({ stockLevel: 1, lowStockThreshold: 3 }, 2)).toThrow(StockError);
  });

  it("rejects zero or negative quantity", () => {
    expect(() => applySale({ stockLevel: 10, lowStockThreshold: 3 }, 0)).toThrow(StockError);
    expect(() => applySale({ stockLevel: 10, lowStockThreshold: 3 }, -1)).toThrow(StockError);
  });

  it("rejects non-integer quantity", () => {
    expect(() => applySale({ stockLevel: 10, lowStockThreshold: 3 }, 1.5)).toThrow(StockError);
  });

  it("isLowStock true when at or below threshold", () => {
    expect(isLowStock({ stockLevel: 3, lowStockThreshold: 3 })).toBe(true);
    expect(isLowStock({ stockLevel: 2, lowStockThreshold: 3 })).toBe(true);
    expect(isLowStock({ stockLevel: 4, lowStockThreshold: 3 })).toBe(false);
  });

  it("gross multiplies and rounds to piastre", () => {
    expect(gross(33.333, 3)).toBe(100);
    expect(gross(10.55, 2)).toBe(21.1);
  });

  it("profit applies SRS §10.2 example 6 (gloves: sale 600, cost 350, qty 1 → profit 250)", () => {
    expect(profit({ unitPrice: 600, costPrice: 350, quantity: 1 })).toBe(250);
  });
});
