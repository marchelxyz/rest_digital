export type LoyaltyProviderKind = "app_only" | "iiko" | "rkeeper";

export type LoyaltyCustomer = {
  id: string;
  tenantId: string;
  phone: string;
  name: string | null;
};

export type LoyaltyBalance = {
  points: number;
  stamps: number;
  // В будущем: уровни, купоны, iiko-баланс и т.д.
};

export type LoyaltyScanResult = {
  customer: LoyaltyCustomer;
  balance: LoyaltyBalance;
  // В будущем: POS-идентификаторы, доступные операции.
};

export type LoyaltyAdjustArgs = {
  customerId: string;
  deltaPoints?: number;
  deltaStamps?: number;
};

export type LoyaltyAdjustResult = {
  customerId: string;
  balance: LoyaltyBalance;
};

export type LoyaltyProvider = {
  kind: LoyaltyProviderKind;
  scanByCode(args: { tenantId: string; code: string }): Promise<LoyaltyScanResult>;
  adjust(args: { tenantId: string; actorRole: string; input: LoyaltyAdjustArgs }): Promise<LoyaltyAdjustResult>;
};

