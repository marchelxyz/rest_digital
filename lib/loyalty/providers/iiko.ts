import type { LoyaltyProvider } from "@/lib/loyalty/types";

export const iikoProvider: LoyaltyProvider = {
  kind: "iiko",

  async scanByCode() {
    // TODO: iikoCard/iikoCard5 Cloud API endpoints required.
    // We intentionally do not implement without official API spec to avoid incorrect behavior.
    throw new Error("iikoCard/iikoCard5: интеграция лояльности ещё не настроена");
  },

  async adjust() {
    // TODO: implement when official API methods are defined.
    throw new Error("iikoCard/iikoCard5: операции лояльности ещё не настроены");
  },
};

