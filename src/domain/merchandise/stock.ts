// Stock invariants — pure logic.
// FR-MRC-02 / FR-MRC-04: stock level + low-stock threshold; sales decrement stock.

export class StockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockError";
  }
}

export interface StockState {
  stockLevel: number;
  lowStockThreshold: number;
}

export function applySale(state: StockState, quantity: number): StockState {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new StockError("Sale quantity must be a positive integer");
  }
  if (state.stockLevel < quantity) {
    throw new StockError(
      `Insufficient stock: trying to sell ${quantity}, only ${state.stockLevel} available`,
    );
  }
  return { ...state, stockLevel: state.stockLevel - quantity };
}

export function isLowStock(state: StockState): boolean {
  return state.stockLevel <= state.lowStockThreshold;
}

export function gross(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100;
}

export function profit(input: {
  unitPrice: number;
  costPrice: number;
  quantity: number;
}): number {
  return Math.round((input.unitPrice - input.costPrice) * input.quantity * 100) / 100;
}
