import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import type { LoyaltyProvider, LoyaltyScanResult } from "@/lib/loyalty/types";

function _normalizePhone(input: string): string {
  return input.replace(/[^\d+]/g, "").trim();
}

function _toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in (value as object)) return Number(String(value));
  return Number(value);
}

export const appOnlyProvider: LoyaltyProvider = {
  kind: "app_only",

  async scanByCode(args: { tenantId: string; code: string }): Promise<LoyaltyScanResult> {
    const codeRaw = args.code.trim();
    const phone = _normalizePhone(codeRaw);
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: args.tenantId,
        OR: [
          { referralCode: codeRaw },
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: {
        id: true,
        tenantId: true,
        phone: true,
        name: true,
        points: true,
        stamps: true,
      },
    });
    if (!customer) {
      throw new Error("Гость не найден");
    }
    return {
      customer: { id: customer.id, tenantId: customer.tenantId, phone: customer.phone, name: customer.name },
      balance: { points: _toNumber(customer.points), stamps: customer.stamps },
    };
  },

  async adjust(args: { tenantId: string; actorRole: string; input: { customerId: string; deltaPoints?: number; deltaStamps?: number } }) {
    if (args.actorRole !== "OWNER" && args.actorRole !== "MANAGER") {
      throw new Error("Forbidden");
    }
    const deltaPoints = args.input.deltaPoints ?? 0;
    const deltaStamps = args.input.deltaStamps ?? 0;
    if (!Number.isFinite(deltaPoints) || !Number.isFinite(deltaStamps)) {
      throw new Error("Некорректные значения");
    }
    if (deltaPoints === 0 && deltaStamps === 0) {
      throw new Error("Нужно указать deltaPoints или deltaStamps");
    }

    const customer = await prisma.customer.findFirst({
      where: { id: args.input.customerId, tenantId: args.tenantId },
      select: { id: true, points: true, stamps: true },
    });
    if (!customer) throw new Error("Гость не найден");

    const nextPoints = _toNumber(customer.points) + deltaPoints;
    const nextStamps = customer.stamps + deltaStamps;
    if (nextPoints < 0) throw new Error("Недостаточно баллов");
    if (nextStamps < 0) throw new Error("Недостаточно штампов");

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        points: new Decimal(nextPoints),
        stamps: nextStamps,
      },
      select: { id: true, points: true, stamps: true },
    });

    return {
      customerId: updated.id,
      balance: { points: _toNumber(updated.points), stamps: updated.stamps },
    };
  },
};

