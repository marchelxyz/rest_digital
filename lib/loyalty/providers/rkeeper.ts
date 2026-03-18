import type { LoyaltyProvider } from "@/lib/loyalty/types";

export const rkeeperProvider: LoyaltyProvider = {
  kind: "rkeeper",

  async scanByCode() {
    throw new Error("r_keeper: интеграция лояльности ещё не настроена");
  },

  async adjust() {
    throw new Error("r_keeper: операции лояльности ещё не настроены");
  },
};

