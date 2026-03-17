/**
 * POST /api/public/orders — создание заказа от клиента
 * Body: { tenantId, phone?, name?, type, items, address?, comment? }
 * При включённой интеграции iiko заказ также отправляется в iiko.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAccessToken, createOrder } from "@/lib/iiko/client";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenantId?: string;
    phone?: string;
    name?: string;
    type?: string;
    platform?: string;
    platformUserId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
    items?: {
      productId: string;
      quantity: number;
      price: number;
      modifiers?: string;
    }[];
    address?: string;
    comment?: string;
  };
  const tenantId = body.tenantId;
  const phone = body.phone?.trim() ?? "";
  const orderType = (body.type ?? "PICKUP") as "DELIVERY" | "PICKUP" | "DINE_IN";
  const items = body.items ?? [];
  if (!tenantId || !phone || items.length === 0) {
    return NextResponse.json(
      { error: "tenantId, phone и items обязательны" },
      { status: 400 }
    );
  }
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId, isActive: true } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  let customer = await prisma.customer.findUnique({
    where: { tenantId_phone: { tenantId, phone } },
  });
  const utmData = {
    platform: body.platform ?? null,
    platformUserId: body.platformUserId ?? null,
    utmSource: body.utmSource ?? null,
    utmMedium: body.utmMedium ?? null,
    utmCampaign: body.utmCampaign ?? null,
    utmTerm: body.utmTerm ?? null,
    utmContent: body.utmContent ?? null,
  };
  const platform = body.platform ?? "";
  const platformUserId = (body.platformUserId ?? "").trim();
  const messengerLink: { telegramUserId?: string; vkUserId?: string; maxUserId?: string } = {};
  if (platform === "telegram" && platformUserId) messengerLink.telegramUserId = platformUserId;
  if (platform === "vk" && platformUserId) messengerLink.vkUserId = platformUserId;
  if (platform === "max" && platformUserId) messengerLink.maxUserId = platformUserId;

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        tenantId,
        phone,
        name: body.name?.trim() ?? null,
        ...utmData,
        ...messengerLink,
      },
    });
  } else {
    const updateData: { name?: string; telegramUserId?: string; vkUserId?: string; maxUserId?: string } = {};
    if (body.name?.trim()) updateData.name = body.name.trim();
    if (Object.keys(messengerLink).length > 0) Object.assign(updateData, messengerLink);
    if (Object.keys(updateData).length > 0) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: updateData,
      });
    }
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId, isAvailable: true },
    include: { modifierGroups: { include: { options: true } } },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Некоторые товары недоступны" }, { status: 400 });
  }

  let totalAmount = 0;
  const orderItems = items.map((item) => {
    const price = item.price;
    const lineTotal = price * item.quantity;
    totalAmount += lineTotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price,
      modifiers: item.modifiers ?? null,
    };
  });

  const order = await prisma.order.create({
    data: {
      tenantId,
      customerId: customer.id,
      type: orderType,
      totalAmount,
      address: orderType === "DELIVERY" ? body.address ?? null : null,
      comment: body.comment ?? null,
      platform: body.platform ?? null,
      utmSource: body.utmSource ?? null,
      utmMedium: body.utmMedium ?? null,
      utmCampaign: body.utmCampaign ?? null,
      utmTerm: body.utmTerm ?? null,
      utmContent: body.utmContent ?? null,
      items: { create: orderItems },
    },
    include: { items: { include: { product: true } }, customer: true },
  });

  // Отправка в iiko при настроенной интеграции
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });
  const iikoConfig =
    settings?.iikoApiLogin &&
    settings?.iikoOrganizationId &&
    settings?.iikoTerminalGroupId &&
    settings?.iikoOrderTypeId &&
    settings?.iikoPaymentTypeId;
  if (iikoConfig && settings) {
    try {
      const token = await getAccessToken(settings.iikoApiLogin!);
      const productMap = new Map(products.map((p) => [p.id, p]));
      const iikoItems = orderItems.map((item) => {
        const p = productMap.get(item.productId);
        const iikoProductId = p?.iikoProductId ?? item.productId;
        let modifiers: { productId: string; productGroupId: string; amount: number }[] = [];
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
      const result = await createOrder(token, {
        organizationId: settings.iikoOrganizationId!,
        terminalGroupId: settings.iikoTerminalGroupId!,
        orderTypeId: settings.iikoOrderTypeId!,
        paymentTypeId: settings.iikoPaymentTypeId!,
        phone,
        customerName: customer.name ?? undefined,
        items: iikoItems,
        totalAmount: Number(totalAmount),
        address: orderType === "DELIVERY" ? body.address ?? undefined : undefined,
        comment: body.comment ?? undefined,
        sourceKey: "rest_digital",
      });
      if (result.creationStatus === "Success" && result.orderId) {
        await prisma.order.update({
          where: { id: order.id },
          data: { iikoOrderId: result.orderId },
        });
      }
    } catch (e) {
      console.error("[iiko] order create failed:", e);
      // Заказ в нашей БД уже создан, iiko-ошибка не отменяет его
    }
  }

  // Бонусы начисляются только после подтверждения заказа (см. PATCH /api/restaurant/orders/[id]/status)
  return NextResponse.json(order);
}
