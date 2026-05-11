// SRS §10 — Financial Calculation Rules
// All percentages stored to 2 decimal places; intermediate calc uses full precision;
// final amounts round to nearest piastre (0.01 EGP).

export type RevenueType =
  | "SUBSCRIPTION"
  | "PRIVATE_SESSION"
  | "BELT_EXAM"
  | "CHAMPIONSHIP"
  | "MERCHANDISE";

export type RecipientType =
  | "CSK"
  | "VENUE"
  | "COACH"
  | "FEDERATION"
  | "TAX_ADMIN"
  | "DISCIPLINE_OWNER";

export interface SplitRule {
  recipientType: RecipientType;
  percent: number; // 0..100 inclusive
  recipientUserId?: string;
  recipientLocationId?: string;
  label?: string;
}

export interface SplitInput {
  /** Gross before discount */
  grossAmount: number;
  /** Optional discount applied to gross before split */
  discountPercent?: number;
  /** Optional fixed discount amount applied after percent */
  discountFixed?: number;
  /** Rules drawn from location config + coach contract overrides */
  rules: SplitRule[];
}

export interface ComputedSplit {
  recipientType: RecipientType;
  recipientUserId?: string;
  recipientLocationId?: string;
  label?: string;
  percent: number;
  amount: number;
}

export interface SplitResult {
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  splits: ComputedSplit[];
  /** Sum of split amounts — should equal netAmount within ±0.01 */
  splitTotal: number;
}
