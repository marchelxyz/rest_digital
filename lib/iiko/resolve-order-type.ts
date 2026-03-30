import type { TenantSettings } from "@prisma/client";

/**
 * Возвращает UUID типа заказа iiko в зависимости от канала заказа в приложении.
 */
export function getIikoOrderTypeIdByOrderType(args: {
  orderType: "DELIVERY" | "PICKUP" | "DINE_IN";
  settings: Pick<
    TenantSettings,
    | "iikoOrderTypeId"
    | "iikoOrderTypeIdDelivery"
    | "iikoOrderTypeIdPickup"
    | "iikoOrderTypeIdDineIn"
  >;
}): string | null {
  const { orderType, settings } = args;
  if (orderType === "DELIVERY") {
    return settings.iikoOrderTypeIdDelivery?.trim() || settings.iikoOrderTypeId?.trim() || null;
  }
  if (orderType === "PICKUP") {
    return settings.iikoOrderTypeIdPickup?.trim() || settings.iikoOrderTypeId?.trim() || null;
  }
  return settings.iikoOrderTypeIdDineIn?.trim() || settings.iikoOrderTypeId?.trim() || null;
}
