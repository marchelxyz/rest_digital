/**
 * Tenant-scoped Prisma расширения.
 * Все запросы автоматически фильтруются по tenantId.
 * Использовать в API routes для Level 2 (Restaurant Admin).
 */
import { prisma } from "@/lib/db";

export type TenantId = string;

/**
 * Возвращает Prisma-клиент с контекстом tenant.
 * ВАЖНО: Вызывающий код обязан передавать tenantId из сессии/токена.
 */
export function getTenantContext(tenantId: TenantId) {
  return {
    /**
     * Вспомогательный объект для подстановки tenantId в запросы.
     * Использовать: prisma.product.findMany({ where: { ...tenantFilter } })
     */
    where: { tenantId } as const,

    /**
     * Данные для create: { ...data, tenantId }
     */
    createData: <T extends Record<string, unknown>>(data: T) => ({
      ...data,
      tenantId,
    }),

    tenantId,
  };
}
