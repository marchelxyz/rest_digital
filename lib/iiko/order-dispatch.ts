/**
 * Асинхронная отправка заказов в iiko: очередь, резерв слота в БД, дедуп (по mariko enqueueIikoOrder).
 */
import type { OrderType, TenantSettings } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createOrder } from "@/lib/iiko/client";
import { getIikoOrderTypeIdByOrderType } from "@/lib/iiko/resolve-order-type";
import { isRetryableIikoErrorMessage } from "@/lib/iiko/retry-policy";
import { getCachedAccessToken } from "@/lib/iiko/token-cache";

const PENDING_STALE_MS =
  Number.parseInt(process.env.IIKO_PENDING_STALE_MS ?? "", 10) || 5 * 60 * 1000;
const MAX_DISPATCH_ATTEMPTS =
  Number.parseInt(process.env.IIKO_MAX_DISPATCH_ATTEMPTS ?? "", 10) || 5;
const ENQUEUE_DEDUP_MS =
  Number.parseInt(process.env.IIKO_ENQUEUE_DEDUP_WINDOW_MS ?? "", 10) || 90 * 1000;
const RETRY_BATCH_LIMIT =
  Number.parseInt(process.env.IIKO_RETRY_BATCH_LIMIT ?? "", 10) || 25;

const enqueueLocks = new Map<string, number>();

function _cleanupEnqueueLocks(): void {
  const now = Date.now();
  for (const [k, exp] of enqueueLocks) {
    if (exp <= now) {
      enqueueLocks.delete(k);
    }
  }
}

function _hasEnqueueLock(orderId: string): boolean {
  _cleanupEnqueueLocks();
  const exp = enqueueLocks.get(orderId);
  return typeof exp === "number" && exp > Date.now();
}

function _setEnqueueLock(orderId: string): void {
  enqueueLocks.set(orderId, Date.now() + ENQUEUE_DEDUP_MS);
}

/**
 * Ставит заказ в очередь на отправку в iiko (не блокирует HTTP-ответ).
 */
export function enqueueIikoOrderDispatch(orderId: string): void {
  const id = orderId.trim();
  if (!id) {
    return;
  }
  if (_hasEnqueueLock(id)) {
    console.log("[iiko dispatch] duplicate enqueue skipped", id);
    return;
  }
  _setEnqueueLock(id);
  void _runIikoDispatch(id).catch((e) => {
    console.error("[iiko dispatch] unhandled", e);
  });
}

async function _runIikoDispatch(orderId: string): Promise<void> {
  const reserved = await _reserveDispatchSlot(orderId);
  if (!reserved) {
    return;
  }
  await _executeIikoDispatch(orderId);
}

async function _reserveDispatchSlot(orderId: string): Promise<boolean> {
  const staleBefore = new Date(Date.now() - PENDING_STALE_MS);
  const result = await prisma.$executeRaw`
    UPDATE "Order"
    SET
      "iikoProviderStatus" = 'pending',
      "iikoProviderError" = NULL,
      "iikoProviderSyncedAt" = NOW(),
      "iikoDispatchAttempts" = "iikoDispatchAttempts" + 1
    WHERE id = ${orderId}
      AND "iikoOrderId" IS NULL
      AND "iikoDispatchAttempts" < ${MAX_DISPATCH_ATTEMPTS}
      AND (
        "iikoProviderStatus" IS NULL
        OR "iikoProviderStatus" = 'error'
        OR (
          "iikoProviderStatus" = 'pending'
          AND ("iikoProviderSyncedAt" IS NULL OR "iikoProviderSyncedAt" <= ${staleBefore})
        )
      )
  `;
  return Number(result) > 0;
}

function _truncateError(msg: string): string {
  return msg.length > 2000 ? `${msg.slice(0, 1997)}...` : msg;
}

async function _executeIikoDispatch(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: {
        include: {
          product: { include: { modifierGroups: { include: { options: true } } } },
        },
      },
    },
  });
  if (!order) {
    return;
  }

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId: order.tenantId },
  });
  const resolvedOrderTypeId = settings
    ? getIikoOrderTypeIdByOrderType({ orderType: order.type, settings })
    : null;

  const configured =
    settings?.iikoApiLogin?.trim() &&
    settings?.iikoOrganizationId?.trim() &&
    settings?.iikoTerminalGroupId?.trim() &&
    resolvedOrderTypeId &&
    settings?.iikoPaymentTypeId?.trim();

  if (!configured || !settings) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        iikoProviderStatus: "error",
        iikoProviderError: _truncateError("iiko: интеграция не настроена для tenant"),
        iikoProviderSyncedAt: new Date(),
      },
    });
    return;
  }

  const productMap = new Map(order.items.map((it) => [it.productId, it.product]));
  const phone = order.customer.phone;

  const iikoItems = order.items.map((item) => {
    const p = productMap.get(item.productId);
    const iikoProductId = p?.iikoProductId ?? item.productId;
    const modifiers: { productId: string; productGroupId: string; amount: number }[] = [];
    if (item.modifiers && p) {
      try {
        const mods = JSON.parse(item.modifiers) as { optionId: string; quantity?: number }[];
        for (const m of mods) {
          for (const mg of p.modifierGroups) {
            const opt = mg.options.find((o) => o.id === m.optionId);
            if (opt?.iikoProductId && opt?.iikoProductGroupId) {
              modifiers.push({
                productId: opt.iikoProductId,
                productGroupId: opt.iikoProductGroupId,
                amount: m.quantity ?? 1,
              });
            }
          }
        }
      } catch {
        // ignore
      }
    }
    return {
      productId: iikoProductId,
      quantity: item.quantity,
      price: Number(item.price),
      modifiers,
    };
  });

  try {
    const token = await getCachedAccessToken(settings.iikoApiLogin!.trim());
    const result = await createOrder(token, {
      organizationId: settings.iikoOrganizationId!.trim(),
      terminalGroupId: settings.iikoTerminalGroupId!.trim(),
      orderTypeId: resolvedOrderTypeId!,
      paymentTypeId: settings.iikoPaymentTypeId!.trim(),
      phone,
      customerName: order.customer.name ?? undefined,
      items: iikoItems,
      totalAmount: Number(order.totalAmount),
      address: order.type === "DELIVERY" ? order.address ?? undefined : undefined,
      comment: order.comment ?? undefined,
      sourceKey: "rest_digital",
    });

    if (result.creationStatus === "Success" && result.orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          iikoOrderId: result.orderId,
          iikoProviderStatus: "sent",
          iikoProviderError: null,
          iikoProviderSyncedAt: new Date(),
        },
      });
      return;
    }

    const errText =
      result.errorInfo?.message ??
      result.errorInfo?.description ??
      `creationStatus=${result.creationStatus}`;
    await prisma.order.update({
      where: { id: orderId },
      data: {
        iikoProviderStatus: "error",
        iikoProviderError: _truncateError(`iiko: ${errText}`),
        iikoProviderSyncedAt: new Date(),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[iiko dispatch] createOrder failed:", msg);
    await prisma.order.update({
      where: { id: orderId },
      data: {
        iikoProviderStatus: "error",
        iikoProviderError: _truncateError(msg),
        iikoProviderSyncedAt: new Date(),
      },
    });
  }
}

/**
 * Повторная отправка заказов с ошибкой (вызывается из cron).
 */
export async function processIikoRetryBatch(): Promise<{
  enqueued: number;
  skippedNonRetryable: number;
}> {
  const candidates = await prisma.order.findMany({
    where: {
      iikoOrderId: null,
      iikoProviderStatus: "error",
      iikoDispatchAttempts: { lt: MAX_DISPATCH_ATTEMPTS },
    },
    take: RETRY_BATCH_LIMIT,
    orderBy: [{ iikoProviderSyncedAt: "asc" }],
    select: { id: true, iikoProviderError: true },
  });

  let enqueued = 0;
  let skippedNonRetryable = 0;

  for (const row of candidates) {
    if (!isRetryableIikoErrorMessage(row.iikoProviderError)) {
      skippedNonRetryable += 1;
      continue;
    }
    enqueueIikoOrderDispatch(row.id);
    enqueued += 1;
  }

  return { enqueued, skippedNonRetryable };
}

/**
 * Проверка, что для tenant заданы все поля iiko для отправки заказа.
 */
export function isTenantIikoOrderReady(
  settings: TenantSettings | null,
  orderType: OrderType
): boolean {
  if (!settings?.iikoApiLogin?.trim() || !settings?.iikoOrganizationId?.trim()) {
    return false;
  }
  const orderTypeId = getIikoOrderTypeIdByOrderType({ orderType, settings });
  return Boolean(
    settings.iikoTerminalGroupId?.trim() &&
      orderTypeId &&
      settings.iikoPaymentTypeId?.trim()
  );
}
