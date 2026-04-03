/**
 * Загрузка внешнего меню через Cloud API v1: POST /api/1/external_menus и POST /api/1/external_menu.
 * Порядок как в mariko_vld (getExternalMenuCatalog → getMenuCatalog до номенклатуры).
 */
import type { IikoExternalMenuData, IikoExternalMenuItem } from "@/lib/iiko/client";

const IIKO_BASE = "https://api-ru.iiko.services";
const TIMEOUT_MS = 20000;

function _firstArray(...candidates: unknown[]): unknown[] {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }
  return [];
}

function _asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function _buildCatalogChunk(candidate: unknown, label: string): {
  label: string;
  products: unknown[];
  groups: unknown[];
  categories: unknown[];
} | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }
  const c = candidate as Record<string, unknown>;
  const products = _firstArray(c.products, c.items, c.menuItems);
  const groups = _firstArray(c.groups, c.productGroups);
  const categories = _firstArray(c.productCategories, c.categories);
  const hasCatalogArrays =
    Array.isArray(c.products) ||
    Array.isArray(c.items) ||
    Array.isArray(c.menuItems) ||
    Array.isArray(c.groups) ||
    Array.isArray(c.productGroups) ||
    Array.isArray(c.productCategories) ||
    Array.isArray(c.categories);
  if (!hasCatalogArrays) {
    return null;
  }
  return { label, products, groups, categories };
}

function _collectCatalogChunks(payload: unknown): {
  label: string;
  products: unknown[];
  groups: unknown[];
  categories: unknown[];
}[] {
  const chunks: {
    label: string;
    products: unknown[];
    groups: unknown[];
    categories: unknown[];
  }[] = [];
  const seen = new Set<object>();

  function visit(candidate: unknown, label: string, depth: number): void {
    if (!candidate || typeof candidate !== "object") {
      return;
    }
    if (seen.has(candidate as object)) {
      return;
    }
    seen.add(candidate as object);

    const chunk = _buildCatalogChunk(candidate, label);
    if (chunk) {
      chunks.push(chunk);
    }
    if (depth >= 2) {
      return;
    }
    const obj = candidate as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        value.forEach((entry, index) => {
          visit(entry, `${label}.${key}[${index}]`, depth + 1);
        });
        continue;
      }
      if (value && typeof value === "object") {
        visit(value, `${label}.${key}`, depth + 1);
      }
    }
  }

  visit(payload, "root", 0);
  return chunks;
}

function _dedupeById<T extends { id?: string }>(items: T[], prefix: string): T[] {
  const result: T[] = [];
  const seen = new Set<string>();
  let fallback = 0;
  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const id =
      typeof item.id === "string" && item.id.trim()
        ? item.id
        : `${prefix}:fallback:${fallback++}`;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(item);
  }
  return result;
}

function _extractMenuIdsFromListPayload(
  payload: unknown,
  preferred?: string
): string[] {
  const o = payload as Record<string, unknown> | null;
  if (!o || typeof o !== "object") {
    return preferred ? [preferred] : [];
  }
  const candidates = [
    ..._asArray(o.externalMenus),
    ..._asArray(o.menus),
    ..._asArray(o.items),
  ];
  const ids = new Set<string>();
  for (const entry of candidates) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const e = entry as Record<string, unknown>;
    for (const raw of [e.externalMenuId, e.menuId, e.id]) {
      if (typeof raw === "string" && raw.trim()) {
        ids.add(raw.trim());
      }
      if (typeof raw === "number") {
        ids.add(String(raw));
      }
    }
  }
  const list = [...ids];
  if (preferred?.trim()) {
    const p = preferred.trim();
    const rest = list.filter((id) => id !== p);
    return [p, ...rest];
  }
  return list;
}

function _normalizeId(raw: unknown): string {
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }
  if (typeof raw === "number") {
    return String(raw);
  }
  return "";
}

function _extractProductPrice(raw: Record<string, unknown>): number {
  if (typeof raw.price === "number" && Number.isFinite(raw.price)) {
    return Number(raw.price.toFixed(2));
  }
  const sp = raw.sizePrices;
  if (Array.isArray(sp) && sp.length > 0) {
    for (const candidate of sp) {
      if (!candidate || typeof candidate !== "object") {
        continue;
      }
      const c = candidate as Record<string, unknown>;
      const direct = Number(c.price);
      if (Number.isFinite(direct)) {
        return Number(direct.toFixed(2));
      }
      const cur = Number((c.price as { currentPrice?: number } | undefined)?.currentPrice);
      if (Number.isFinite(cur)) {
        return cur >= 1000 ? Number((cur / 100).toFixed(2)) : Number(cur.toFixed(2));
      }
    }
  }
  return 0;
}

function _mapRawToExternalItem(raw: unknown): IikoExternalMenuItem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const p = raw as Record<string, unknown>;
  const id = _normalizeId(p.id ?? p.itemId ?? p.productId);
  if (!id) {
    return null;
  }
  const name = String(p.name ?? "").trim() || id;
  const price = _extractProductPrice(p);
  const productCategoryId = _normalizeId(p.productCategoryId ?? p.categoryId);
  const groupId = _normalizeId(p.groupId);
  const imageLinks = Array.isArray(p.imageLinks)
    ? (p.imageLinks as string[]).filter((x) => typeof x === "string")
    : undefined;
  return {
    id,
    name,
    price,
    productCategoryId: productCategoryId || undefined,
    groupId: groupId || undefined,
    imageLinks,
    itemModifierGroups: p.itemModifierGroups as IikoExternalMenuItem["itemModifierGroups"],
  };
}

function _mapRawToCategory(raw: unknown): { id: string; name: string } | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const c = raw as Record<string, unknown>;
  const id = _normalizeId(c.id);
  if (!id) {
    return null;
  }
  return { id, name: String(c.name ?? "").trim() || id };
}

function _mapRawToGroup(raw: unknown): { id: string; name: string } | null {
  return _mapRawToCategory(raw);
}

/**
 * Сводит ответ v1 к формату для _syncFromExternalMenu.
 */
function _catalogChunksToExternalMenuData(
  chunks: {
    products: unknown[];
    groups: unknown[];
    categories: unknown[];
  }[]
): IikoExternalMenuData | null {
  if (chunks.length === 0) {
    return null;
  }
  const products = _dedupeById(
    chunks
      .flatMap((c) => c.products)
      .map(_mapRawToExternalItem)
      .filter((x): x is IikoExternalMenuItem => x != null),
    "product"
  );
  const categories = _dedupeById(
    chunks
      .flatMap((c) => c.categories)
      .map(_mapRawToCategory)
      .filter((x): x is { id: string; name: string } => x != null),
    "category"
  );
  const groups = _dedupeById(
    chunks
      .flatMap((c) => c.groups)
      .map(_mapRawToGroup)
      .filter((x): x is { id: string; name: string } => x != null),
    "group"
  );

  const catById = new Map<string, { id: string; name: string }>();
  for (const c of categories) {
    catById.set(c.id, c);
  }
  for (const g of groups) {
    if (!catById.has(g.id)) {
      catById.set(g.id, g);
    }
  }
  const mergedCategories = [...catById.values()];

  if (products.length === 0 && mergedCategories.length === 0) {
    return null;
  }
  return {
    categories: mergedCategories.length > 0 ? mergedCategories : undefined,
    products: products.length > 0 ? products : undefined,
    groups: groups.length > 0 ? groups : undefined,
  };
}

function _normaliseCatalogPayload(payload: unknown): IikoExternalMenuData | null {
  const chunks = _collectCatalogChunks(payload);
  if (chunks.length === 0) {
    return null;
  }
  return _catalogChunksToExternalMenuData(chunks);
}

async function _postJson(token: string, path: string, body: unknown): Promise<unknown> {
  const url = `${IIKO_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = (data as { errorDescription?: string })?.errorDescription;
    throw new Error(err ?? `HTTP ${res.status}`);
  }
  return data;
}

async function _tryBodies(
  token: string,
  path: string,
  bodies: unknown[]
): Promise<{ payload: unknown; body: unknown } | null> {
  let lastErr: Error | null = null;
  for (const body of bodies) {
    try {
      const payload = await _postJson(token, path, body);
      return { payload, body };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  if (lastErr) {
    throw lastErr;
  }
  return null;
}

/**
 * Пробует получить состав меню через v1 endpoints (как mariko_vld getExternalMenuCatalog).
 *
 * @param preferredMenuId — id из настроек или из POST /api/2/menu (пробуем в первую очередь).
 */
export async function getExternalMenuCatalogV1(
  token: string,
  organizationId: string,
  preferredMenuId?: string
): Promise<IikoExternalMenuData | null> {
  const listBodies = [
    { organizationIds: [organizationId] },
    { organizationId },
  ];
  let listResult: { payload: unknown; body: unknown } | null = null;
  for (const body of listBodies) {
    try {
      const payload = await _postJson(token, "/api/1/external_menus", body);
      listResult = { payload, body };
      break;
    } catch {
      continue;
    }
  }
  if (!listResult) {
    return null;
  }

  const direct = _normaliseCatalogPayload(listResult.payload);
  if (direct && (_hasProducts(direct) || (direct.categories?.length ?? 0) > 0)) {
    return direct;
  }

  const menuIds = _extractMenuIdsFromListPayload(listResult.payload, preferredMenuId);
  if (menuIds.length === 0) {
    return null;
  }

  const detailBodiesFor = (menuId: string) => [
    { organizationId, externalMenuId: menuId },
    { organizationIds: [organizationId], externalMenuId: menuId },
    { organizationId, menuId },
    { organizationIds: [organizationId], menuId },
    { organizationId, id: menuId },
    { organizationIds: [organizationId], id: menuId },
  ];

  for (const menuId of menuIds) {
    let attempt: { payload: unknown; body: unknown } | null = null;
    try {
      attempt = await _tryBodies(token, "/api/1/external_menu", detailBodiesFor(menuId));
    } catch {
      continue;
    }
    if (!attempt) {
      continue;
    }
    const detail = _normaliseCatalogPayload(attempt.payload);
    if (
      detail &&
      (_hasProducts(detail) || (detail.categories?.length ?? 0) > 0)
    ) {
      return detail;
    }
  }
  return null;
}

function _hasProducts(data: IikoExternalMenuData): boolean {
  return (data.products?.length ?? 0) > 0;
}
