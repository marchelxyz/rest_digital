/**
 * iiko Cloud API Client
 * Официальная документация: https://ru.iiko.help, https://api-ru.iiko.services
 * API: https://api-ru.iiko.services
 */
const BASE_URL = "https://api-ru.iiko.services";
const DEFAULT_TIMEOUT_MS = 15000;

function _log(method: string, url: string, body?: unknown, response?: unknown, error?: unknown): void {
  const ts = new Date().toISOString();
  console.log(`[iiko ${ts}] ${method} ${url}`);
  if (body) console.log(`[iiko ${ts}]   → body:`, JSON.stringify(body, null, 2));
  if (response) console.log(`[iiko ${ts}]   ← response:`, JSON.stringify(response, null, 2));
  if (error) console.error(`[iiko ${ts}]   ✗ error:`, error);
}

export type IikoError = {
  correlationId: string;
  errorDescription: string;
  error?: string;
};

export type IikoOrganization = {
  id: string;
  name: string;
  country?: string;
  restaurantAddress?: string;
};

export type IikoProductCategory = {
  id: string;
  name: string;
  isDeleted?: boolean;
};

export type IikoGroup = {
  id: string;
  name: string;
  parentGroup?: string;
  isDeleted?: boolean;
};

export type IikoSize = {
  id: string;
  name: string;
  isDefault?: boolean;
};

export type IikoModifier = {
  id: string;
  defaultAmount: number;
  minAmount: number;
  maxAmount: number;
  required: boolean;
  productGroupId?: string;
};

export type IikoGroupModifier = {
  id: string;
  minAmount: number;
  maxAmount: number;
  required: boolean;
  childModifiers: { id: string; minAmount: number; maxAmount: number }[];
};

export type IikoProduct = {
  id: string;
  name: string;
  description?: string;
  groupId: string;
  productCategoryId: string;
  type: string;
  sizePrices?: { sizeId: string; price: { currentPrice: number } }[];
  modifiers?: IikoModifier[];
  groupModifiers?: IikoGroupModifier[];
  imageLinks?: string[];
  isDeleted?: boolean;
};

export type IikoNomenclature = {
  groups: IikoGroup[];
  productCategories: IikoProductCategory[];
  products: IikoProduct[];
  sizes: IikoSize[];
  revision: number;
};

export type IikoOrderType = {
  id: string;
  name: string;
  orderServiceType: "Common" | "DeliveryByCourier" | "DeliveryPickUp";
};

export type IikoPaymentType = {
  id: string;
  name: string;
  paymentTypeKind: string;
};

export type IikoTerminalGroup = {
  id: string;
  name: string;
  address?: string;
};

/** Получить access token по API ключу. */
export async function getAccessToken(apiLogin: string): Promise<string> {
  const url = `${BASE_URL}/api/1/access_token`;
  const reqBody = { apiLogin: apiLogin.slice(0, 4) + "****" };
  _log("POST", url, reqBody);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ apiLogin }),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  const data = (await res.json()) as { token?: string; errorDescription?: string };
  if (!res.ok || !data.token) {
    _log("POST", url, undefined, undefined, data.errorDescription ?? `HTTP ${res.status}`);
    throw new Error(data.errorDescription ?? `iiko API error: ${res.status}`);
  }
  _log("POST", url, undefined, { token: data.token.slice(0, 8) + "...", status: res.status });
  return data.token;
}

/** Список организаций. */
export async function getOrganizations(
  token: string,
  options?: { organizationIds?: string[]; returnAdditionalInfo?: boolean }
): Promise<IikoOrganization[]> {
  const url = `${BASE_URL}/api/1/organizations`;
  const reqBody = {
    organizationIds: options?.organizationIds ?? undefined,
    returnAdditionalInfo: options?.returnAdditionalInfo ?? true,
  };
  _log("POST", url, reqBody);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  const data = (await res.json()) as {
    organizations?: IikoOrganization[];
    errorDescription?: string;
  };
  if (!res.ok || !data.organizations) {
    _log("POST", url, undefined, undefined, data.errorDescription ?? `HTTP ${res.status}`);
    throw new Error(data.errorDescription ?? `iiko API error: ${res.status}`);
  }
  _log("POST", url, undefined, { count: data.organizations.length, organizations: data.organizations });
  return data.organizations;
}

/** Номенклатура (меню). */
export async function getNomenclature(
  token: string,
  organizationId: string,
  startRevision = 0
): Promise<IikoNomenclature> {
  const url = `${BASE_URL}/api/1/nomenclature`;
  const reqBody = { organizationId, startRevision };
  _log("POST", url, reqBody);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  const data = (await res.json()) as IikoNomenclature & { errorDescription?: string };
  if (!res.ok) {
    _log("POST", url, undefined, undefined, data.errorDescription ?? `HTTP ${res.status}`);
    throw new Error(data.errorDescription ?? `iiko API error: ${res.status}`);
  }
  _log("POST", url, undefined, {
    groups: data.groups?.length ?? 0,
    products: data.products?.length ?? 0,
    productCategories: data.productCategories?.length ?? 0,
    revision: data.revision,
  });
  return data;
}

/** Типы заказов (доставка, самовывоз, зал). */
export async function getOrderTypes(
  token: string,
  organizationIds: string[]
): Promise<{ organizationId: string; items: IikoOrderType[] }[]> {
  const url = `${BASE_URL}/api/1/deliveries/order_types`;
  _log("POST", url, { organizationIds });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ organizationIds }),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  const data = (await res.json()) as {
    orderTypes?: { organizationId: string; items: { id: string; name: string; orderServiceType: string }[] }[];
    errorDescription?: string;
  };
  if (!res.ok || !data.orderTypes) {
    _log("POST", url, undefined, undefined, data.errorDescription ?? `HTTP ${res.status}`);
    throw new Error(data.errorDescription ?? `iiko API error: ${res.status}`);
  }
  const result = data.orderTypes.map((ot) => ({
    organizationId: ot.organizationId,
    items: ot.items.map((i) => ({
      id: i.id,
      name: i.name,
      orderServiceType: i.orderServiceType as IikoOrderType["orderServiceType"],
    })),
  }));
  _log("POST", url, undefined, result);
  return result;
}

/** Способы оплаты. */
export async function getPaymentTypes(
  token: string,
  organizationIds: string[]
): Promise<IikoPaymentType[]> {
  const url = `${BASE_URL}/api/1/payment_types`;
  _log("POST", url, { organizationIds });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ organizationIds }),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  const data = (await res.json()) as {
    paymentTypes?: { id: string; name: string; paymentTypeKind: string }[];
    errorDescription?: string;
  };
  if (!res.ok || !data.paymentTypes) {
    _log("POST", url, undefined, undefined, data.errorDescription ?? `HTTP ${res.status}`);
    throw new Error(data.errorDescription ?? `iiko API error: ${res.status}`);
  }
  const result = data.paymentTypes.map((p) => ({
    id: p.id,
    name: p.name,
    paymentTypeKind: p.paymentTypeKind,
  }));
  _log("POST", url, undefined, result);
  return result;
}

/** Терминальные группы. */
export async function getTerminalGroups(
  token: string,
  organizationIds: string[],
  includeDisabled?: boolean
): Promise<{ organizationId: string; items: IikoTerminalGroup[] }[]> {
  const url = `${BASE_URL}/api/1/terminal_groups`;
  const reqBody = { organizationIds, includeDisabled: includeDisabled ?? false };
  _log("POST", url, reqBody);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reqBody),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  const data = (await res.json()) as {
    terminalGroups?: { organizationId: string; items: { id: string; name: string }[] }[];
    errorDescription?: string;
  };
  if (!res.ok || !data.terminalGroups) {
    _log("POST", url, undefined, undefined, data.errorDescription ?? `HTTP ${res.status}`);
    throw new Error(data.errorDescription ?? `iiko API error: ${res.status}`);
  }
  const result = data.terminalGroups.map((tg) => ({
    organizationId: tg.organizationId,
    items: tg.items.map((i) => ({ id: i.id, name: i.name })),
  }));
  _log("POST", url, undefined, result);
  return result;
}

/** Стоп-лист (товары, которых нет в наличии). */
export async function getStopLists(
  token: string,
  organizationIds: string[]
): Promise<Set<string>> {
  const url = `${BASE_URL}/api/1/stop_lists`;
  _log("POST", url, { organizationIds });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ organizationIds }),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  const data = (await res.json()) as {
    terminalGroupStopLists?: { organizationId: string; items: { productId: string }[] }[];
    errorDescription?: string;
  };
  if (!res.ok) {
    _log("POST", url, undefined, undefined, data.errorDescription ?? `HTTP ${res.status}`);
    throw new Error(data.errorDescription ?? `iiko API error: ${res.status}`);
  }
  const ids = new Set<string>();
  for (const tg of data.terminalGroupStopLists ?? []) {
    for (const it of tg.items ?? []) {
      ids.add(it.productId);
    }
  }
  _log("POST", url, undefined, { stopListProductCount: ids.size });
  return ids;
}

/** Результат создания заказа в iiko. */
export type IikoOrderCreateResult = {
  orderId: string;
  externalNumber?: string;
  creationStatus: "Success" | "InProgress" | "Error";
  errorInfo?: { code: string; message: string; description: string };
};

function _uuid(): string {
  return crypto.randomUUID();
}

/** Создать заказ в iiko (order/create). */
export async function createOrder(
  token: string,
  params: {
    organizationId: string;
    terminalGroupId: string;
    orderTypeId: string;
    paymentTypeId: string;
    phone: string;
    customerName?: string;
    items: { productId: string; quantity: number; price: number; modifiers?: { productId: string; productGroupId: string; amount: number }[] }[];
    totalAmount: number;
    address?: string;
    comment?: string;
    sourceKey?: string;
  }
): Promise<IikoOrderCreateResult> {
  const orderId = _uuid();

  const items = params.items.map((item) => {
    const positionId = _uuid();
    const modifiers = (item.modifiers ?? []).map((m) => ({
      productId: m.productId,
      productGroupId: m.productGroupId,
      amount: m.amount,
      positionId: _uuid(),
    }));
    return {
      type: "Product" as const,
      amount: item.quantity,
      productSizeId: "00000000-0000-0000-0000-000000000000",
      primaryComponent: {
        productId: item.productId,
        price: item.price,
        positionId,
        modifiers,
      },
    };
  });

  const order = {
    id: orderId,
    orderTypeId: params.orderTypeId,
    phone: params.phone,
    customer: { name: params.customerName ?? "" },
    items,
    payments: [
      {
        paymentTypeId: params.paymentTypeId,
        paymentTypeKind: "Cash" as const,
        sum: params.totalAmount,
        isProcessedExternally: false,
      },
    ],
    sourceKey: params.sourceKey ?? "rest_digital",
    comment: params.comment ?? undefined,
  };

  const url = `${BASE_URL}/api/1/order/create`;
  const fullBody = {
    organizationId: params.organizationId,
    terminalGroupId: params.terminalGroupId,
    order,
    createOrderSettings: { transportToFrontTimeout: 8 },
  };
  _log("POST", url, fullBody);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(fullBody),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  const data = (await res.json()) as {
    orderInfo?: {
      id: string;
      externalNumber?: string;
      creationStatus: string;
      errorInfo?: { code: string; message: string; description: string };
    };
    errorDescription?: string;
  };

  if (!res.ok) {
    _log("POST", url, undefined, undefined, data.errorDescription ?? `HTTP ${res.status}`);
    throw new Error(data.errorDescription ?? `iiko API error: ${res.status}`);
  }

  const info = data.orderInfo;
  if (!info) {
    _log("POST", url, undefined, undefined, "orderInfo missing in response");
    throw new Error("iiko: orderInfo missing")
  }

  _log("POST", url, undefined, {
    orderId: info.id,
    externalNumber: info.externalNumber,
    creationStatus: info.creationStatus,
    errorInfo: info.errorInfo,
  });

  return {
    orderId: info.id,
    externalNumber: info.externalNumber,
    creationStatus: info.creationStatus as IikoOrderCreateResult["creationStatus"],
    errorInfo: info.errorInfo,
  };
}
