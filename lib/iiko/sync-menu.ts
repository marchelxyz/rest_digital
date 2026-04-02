/**
 * Синхронизация меню из iiko в Rest Digital.
 * Используется из API роутов superadmin и restaurant.
 */
import { prisma } from "@/lib/db";
import {
  getNomenclature,
  getStopLists,
  getExternalMenusForTenant,
  getExternalMenuById,
  type IikoProduct,
  type IikoGroup,
  type IikoExternalMenuData,
  type IikoExternalMenuInfo,
} from "@/lib/iiko/client";
import { getCachedAccessToken } from "@/lib/iiko/token-cache";

export type SyncMenuResult = {
  ok: boolean;
  source: "nomenclature" | "external_menu";
  created: number;
  updated: number;
  revision?: number;
  /** Пояснение для UI: почему выбран источник или что проверить при 0 позиций. */
  hint?: string;
};

/**
 * Синхронизирует меню из iiko для указанного tenant.
 *
 * Достаточно API-ключа Cloud API и организации. Сначала пробуем внешнее меню (если iiko
 * отдаёт список в POST /api/2/menu или задан id меню в настройках), иначе — номенклатура
 * (/api/1/nomenclature). Пустое или заведомо некорректное значение в поле id меню игнорируется.
 */
export async function syncIikoMenuForTenant(
  tenantId: string
): Promise<SyncMenuResult> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });
  if (!settings?.iikoApiLogin?.trim() || !settings?.iikoOrganizationId?.trim()) {
    throw new Error("iikoApiLogin и iikoOrganizationId должны быть заданы");
  }

  const orgId = settings.iikoOrganizationId.trim();
  const token = await getCachedAccessToken(settings.iikoApiLogin.trim());
  const stopProductIds = await getStopLists(token, [orgId]);

  const menus = await getExternalMenusForTenant(token, orgId).catch(() => []);
  const rawExternal = settings.iikoExternalMenuId?.trim() ?? "";
  const explicitRaw = _isValidExternalMenuId(rawExternal) ? rawExternal : "";
  /** iiko отдаёт составной id (`76108#2`); в настройках мог остаться только префикс — by_id требует полный id. */
  const explicitResolved = explicitRaw
    ? _resolveCanonicalExternalMenuId(menus, explicitRaw)
    : "";
  const autoResolved = explicitResolved
    ? ""
    : _pickFirstExternalMenuIdFromList(menus, orgId) ?? "";
  const externalMenuId = explicitResolved || autoResolved;

  if (externalMenuId) {
    try {
      const ext = await _loadExternalMenuPayload(
        token,
        orgId,
        externalMenuId,
        settings.iikoExternalMenuPriceCategoryId?.trim() || undefined,
        menus
      );
      if (ext && _externalMenuHasContent(ext)) {
        return _syncFromExternalMenu(tenantId, ext, stopProductIds);
      }
      if (explicitRaw) {
        return _emptyExternalMenuSyncResult();
      }
    } catch (err) {
      if (explicitRaw) {
        throw err instanceof Error ? err : new Error(String(err));
      }
    }
  }

  const nom = await getNomenclature(token, orgId);
  return _syncFromNomenclature(tenantId, nom, stopProductIds);
}

/** Непустой id внешнего меню (UUID или числовая строка из Cloud API / iiko). */
function _isValidExternalMenuId(value: string): boolean {
  const t = value.trim();
  return t.length > 0 && t.length <= 128;
}

/**
 * Приводит id из настроек к тому виду, что в каталоге POST /api/2/menu (например `76108` → `76108#2`).
 * Иначе by_id отвечает: External menu id does not belong to your ApiLogin.
 */
function _resolveCanonicalExternalMenuId(
  menus: IikoExternalMenuInfo[],
  requested: string
): string {
  const t = requested.trim();
  if (!t) {
    return t;
  }
  if (menus.some((m) => m.id === t)) {
    return t;
  }
  const composite = menus.filter((m) => {
    const id = m.id;
    return id.startsWith(`${t}#`) || id.startsWith(`${t}:`);
  });
  if (composite.length === 1) {
    return composite[0].id;
  }
  return t;
}

function _pickFirstExternalMenuIdFromList(
  menus: IikoExternalMenuInfo[],
  orgId: string
): string | null {
  if (menus.length === 0) {
    return null;
  }
  const forOrg = menus.filter(
    (m) => !m.organizationId || m.organizationId === orgId
  );
  return (forOrg.length > 0 ? forOrg : menus)[0]?.id ?? null;
}

/**
 * Составной id из POST /api/2/menu (`76108#2` = базовое меню + категория цен).
 * В by_id нельзя передавать строку целиком: иначе «Price category id is not correct».
 */
function _splitCompositeExternalMenuId(
  id: string
): { base: string; suffix: string } | null {
  const hash = id.indexOf("#");
  if (hash <= 0 || hash >= id.length - 1) {
    return null;
  }
  const base = id.slice(0, hash).trim();
  const suffix = id.slice(hash + 1).trim();
  if (!base || !suffix) {
    return null;
  }
  return { base, suffix };
}

/**
 * Загружает состав внешнего меню, перебирая категории цен: без них iiko часто отдаёт пустой ответ.
 */
async function _loadExternalMenuPayload(
  token: string,
  organizationId: string,
  externalMenuId: string,
  savedPriceCategoryId: string | undefined,
  menusCache?: IikoExternalMenuInfo[]
): Promise<IikoExternalMenuData | null> {
  const menus =
    menusCache ??
    (await getExternalMenusForTenant(token, organizationId).catch(() => []));
  const meta = menus.find((m) => m.id === externalMenuId);

  const composite = _splitCompositeExternalMenuId(externalMenuId);
  /** С saved/meta категориями цен сочетать базовый id, а не `76108#2`. */
  const idForListedPriceCategories = composite?.base ?? externalMenuId;

  const attempts: { externalMenuId: string; priceCategoryId?: string }[] = [];
  const seen = new Set<string>();
  const pushAttempt = (eid: string, pc?: string) => {
    const key = `${eid}\0${pc ?? ""}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    attempts.push({ externalMenuId: eid, priceCategoryId: pc });
  };

  if (savedPriceCategoryId) {
    pushAttempt(idForListedPriceCategories, savedPriceCategoryId);
  }
  for (const pc of meta?.priceCategoryIds ?? []) {
    if (pc) {
      pushAttempt(idForListedPriceCategories, pc);
    }
  }
  if (composite) {
    pushAttempt(composite.base, composite.suffix);
    pushAttempt(composite.base, undefined);
  }
  pushAttempt(externalMenuId, undefined);

  for (const a of attempts) {
    try {
      const ext = await getExternalMenuById(token, {
        organizationId,
        externalMenuId: a.externalMenuId,
        priceCategoryId: a.priceCategoryId,
      });
      if (_externalMenuHasContent(ext)) {
        return ext;
      }
    } catch {
      // пробуем следующий вариант (неверная пара id/категория и т.п.)
    }
  }
  return null;
}

function _externalMenuHasContent(ext: unknown): boolean {
  if (!ext || typeof ext !== "object") {
    return false;
  }
  const raw = ext as Record<string, unknown>;
  const menuKeys = [
    "productCategories",
    "categories",
    "itemCategories",
    "products",
    "items",
    "productItems",
  ];
  for (const key of menuKeys) {
    const v = raw[key];
    if (Array.isArray(v) && v.length > 0) {
      return true;
    }
  }
  const ignoreArrayKeys = new Set([
    "terminalGroupIds",
    "terminalGroupStopLists",
    "warnings",
  ]);
  for (const [key, v] of Object.entries(raw)) {
    if (ignoreArrayKeys.has(key)) {
      continue;
    }
    if (Array.isArray(v) && v.length > 0) {
      return true;
    }
  }
  return false;
}

function _emptyExternalMenuSyncResult(): SyncMenuResult {
  return {
    ok: true,
    source: "external_menu",
    created: 0,
    updated: 0,
    hint:
      "Внешнее меню в iiko пустое или для него не подошла категория цен. Проверьте меню в iikoWeb и поле «Категория цен» в настройках.",
  };
}

async function _syncFromNomenclature(
  tenantId: string,
  nom: Awaited<ReturnType<typeof getNomenclature>>,
  stopProductIds: Set<string>
): Promise<SyncMenuResult> {
  const productMap = new Map<string, IikoProduct>();
  for (const p of nom.products ?? []) {
    productMap.set(p.id, p);
  }
  const groupMap = new Map<string, IikoGroup>();
  for (const g of nom.groups ?? []) {
    groupMap.set(g.id, g);
  }

  const categoryByName = new Map<string, string>();
  for (const pc of nom.productCategories ?? []) {
    if (pc.isDeleted) continue;
    let cat = await prisma.category.findFirst({
      where: { tenantId, name: pc.name },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: { tenantId, name: pc.name },
      });
    }
    categoryByName.set(pc.name, cat.id);
  }

  const products = (nom.products ?? []).filter((p) => !p.isDeleted);
  let created = 0;
  let updated = 0;

  for (const p of products) {
    const sp = p.sizePrices?.[0];
    const priceVal =
      sp && typeof sp === "object" && "price" in sp
        ? (sp as { price?: { currentPrice?: number } }).price?.currentPrice
        : (sp as { currentPrice?: number } | undefined)?.currentPrice;
    const price = typeof priceVal === "number" ? priceVal / 100 : 0;
    const categoryId =
      categoryByName.get(
        nom.productCategories?.find((c) => c.id === p.productCategoryId)
          ?.name ?? "Прочее"
      ) ?? (await prisma.category.findFirst({ where: { tenantId } }))?.id;
    if (!categoryId) continue;

    const existing = await prisma.product.findFirst({
      where: { tenantId, iikoProductId: p.id },
      include: { modifierGroups: { include: { options: true } } },
    });

    const isOnStopList = stopProductIds.has(p.id);

    const productData = {
      tenantId,
      categoryId,
      name: p.name,
      description: p.description ?? null,
      price,
      imageUrl: p.imageLinks?.[0] ?? null,
      iikoProductId: p.id,
      isAvailable: !isOnStopList,
      isActive: true,
      isPublished: true,
    };

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      });
      updated++;
      for (const gm of p.groupModifiers ?? []) {
        if (gm.childModifiers?.length === 0) continue;
        let modGroup = existing.modifierGroups.find(
          (mg) => mg.iikoProductGroupId === gm.id
        ) as { id: string; options?: { iikoProductId: string | null }[] } | undefined;
        if (!modGroup) {
          modGroup = (await prisma.modifierGroup.create({
            data: {
              tenantId,
              productId: existing.id,
              name: groupMap.get(gm.id)?.name ?? "Добавки",
              type: gm.maxAmount > 1 ? "quantity" : "single",
              isRequired: gm.required,
              minSelect: gm.minAmount,
              maxSelect: gm.maxAmount,
              iikoProductGroupId: gm.id,
            },
          })) as { id: string; options?: { iikoProductId: string | null }[] };
        }
        for (const cm of gm.childModifiers) {
          const modProduct = productMap.get(cm.id);
          const modPrice =
            modProduct?.sizePrices?.[0]?.price?.currentPrice != null
              ? modProduct.sizePrices![0].price.currentPrice / 100
              : 0;
          const opt = modGroup?.options?.find((o) => o.iikoProductId === cm.id);
          if (!opt && modGroup) {
            await prisma.modifierOption.create({
              data: {
                tenantId,
                modifierGroupId: modGroup.id,
                name: modProduct?.name ?? "Опция",
                priceDelta: modPrice,
                iikoProductId: cm.id,
                iikoProductGroupId: gm.id,
              },
            });
          }
        }
      }
    } else {
      const newProduct = await prisma.product.create({
        data: productData,
      });
      created++;
      for (const gm of p.groupModifiers ?? []) {
        if (gm.childModifiers?.length === 0) continue;
        const modGroup = await prisma.modifierGroup.create({
          data: {
            tenantId,
            productId: newProduct.id,
            name: groupMap.get(gm.id)?.name ?? "Добавки",
            type: gm.maxAmount > 1 ? "quantity" : "single",
            isRequired: gm.required,
            minSelect: gm.minAmount,
            maxSelect: gm.maxAmount,
            iikoProductGroupId: gm.id,
          },
        });
        for (const cm of gm.childModifiers) {
          const modProduct = productMap.get(cm.id);
          const modPrice =
            modProduct?.sizePrices?.[0]?.price?.currentPrice != null
              ? modProduct.sizePrices![0].price.currentPrice / 100
              : 0;
          await prisma.modifierOption.create({
            data: {
              tenantId,
              modifierGroupId: modGroup.id,
              name: modProduct?.name ?? "Опция",
              priceDelta: modPrice,
              iikoProductId: cm.id,
              iikoProductGroupId: gm.id,
            },
          });
        }
      }
    }
  }

  const hint =
    created === 0 && updated === 0
      ? "Использована номенклатура: внешнее меню не загружено (нет меню для организации, пустой ответ API или ошибка при автоподборе). Создайте внешнее меню в iiko и выберите его в настройках ниже."
      : undefined;

  return {
    ok: true,
    source: "nomenclature",
    created,
    updated,
    revision: nom.revision,
    hint,
  };
}

async function _syncFromExternalMenu(
  tenantId: string,
  ext: { categories?: { id: string; name: string }[]; products?: unknown[] },
  stopProductIds: Set<string>
): Promise<SyncMenuResult> {
  const raw = ext as {
    productCategories?: { id: string; name: string }[];
    categories?: { id: string; name: string }[];
    itemCategories?: { id: string; name: string }[];
    products?: {
      id: string;
      name: string;
      price?: number;
      productCategoryId?: string;
      groupId?: string;
      imageLinks?: string[];
      itemModifierGroups?: unknown[];
    }[];
    items?: {
      id: string;
      name: string;
      price?: number;
      productCategoryId?: string;
      groupId?: string;
      imageLinks?: string[];
      itemModifierGroups?: unknown[];
    }[];
  };
  const cats =
    raw.productCategories ?? raw.categories ?? raw.itemCategories ?? [];
  const prods = raw.products ?? raw.items ?? [];

  const categoryByIikoId = new Map<string, string>();
  for (const c of cats) {
    let cat = await prisma.category.findFirst({
      where: { tenantId, name: c.name },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: { tenantId, name: c.name },
      });
    }
    categoryByIikoId.set(c.id, cat.id);
  }

  let defaultCatId: string | null = null;
  if (cats.length > 0) {
    defaultCatId = categoryByIikoId.get(cats[0].id) ?? null;
  }
  if (!defaultCatId) {
    defaultCatId = (
      await prisma.category.findFirst({ where: { tenantId } })
    )?.id ?? null;
    if (!defaultCatId) {
      const def = await prisma.category.create({
        data: { tenantId, name: "Меню" },
      });
      defaultCatId = def.id;
    }
  }

  let created = 0;
  let updated = 0;

  for (const p of prods) {
    const catId =
      categoryByIikoId.get(p.productCategoryId ?? p.groupId ?? "") ??
      defaultCatId;
    if (!catId) continue;

    const price = typeof p.price === "number" ? p.price : 0;
    const isOnStopList = stopProductIds.has(p.id);

    const existing = await prisma.product.findFirst({
      where: { tenantId, iikoProductId: p.id },
      include: { modifierGroups: { include: { options: true } } },
    });

    const productData = {
      tenantId,
      categoryId: catId,
      name: p.name,
      description: null,
      price,
      imageUrl: p.imageLinks?.[0] ?? null,
      iikoProductId: p.id,
      isAvailable: !isOnStopList,
      isActive: true,
      isPublished: true,
    };

    let productId: string;
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      });
      productId = existing.id;
      updated++;
    } else {
      const newP = await prisma.product.create({ data: productData });
      productId = newP.id;
      created++;
    }

    const itemModGroups = (p.itemModifierGroups ?? []) as {
      id: string;
      name?: string;
      minQuantity?: number;
      maxQuantity?: number;
      childModifiers?: { id: string; name?: string }[];
    }[];
    if (itemModGroups.length > 0) {
      let modGroups: {
        id: string;
        iikoProductGroupId: string | null;
        options: { iikoProductId: string | null }[];
      }[] = [];
      const fresh = await prisma.product.findUnique({
        where: { id: productId },
        include: { modifierGroups: { include: { options: true } } },
      });
      if (fresh) modGroups = fresh.modifierGroups;

      for (const img of itemModGroups) {
        let modGroup = modGroups.find((mg) => mg.iikoProductGroupId === img.id);
        if (!modGroup) {
          const createdMg = await prisma.modifierGroup.create({
            data: {
              tenantId,
              productId,
              name: img.name ?? "Добавки",
              type: (img.maxQuantity ?? 1) > 1 ? "quantity" : "single",
              isRequired: (img.minQuantity ?? 0) > 0,
              minSelect: img.minQuantity ?? 0,
              maxSelect: img.maxQuantity ?? 1,
              iikoProductGroupId: img.id,
            },
            include: { options: true },
          });
          modGroup = createdMg;
          modGroups.push(createdMg);
        }
        for (const cm of img.childModifiers ?? []) {
          const opt = modGroup.options?.find((o) => o.iikoProductId === cm.id);
          if (!opt) {
            await prisma.modifierOption.create({
              data: {
                tenantId,
                modifierGroupId: modGroup.id,
                name: (cm as { name?: string }).name ?? "Опция",
                priceDelta: 0,
                iikoProductId: cm.id,
                iikoProductGroupId: img.id,
              },
            });
          }
        }
      }
    }
  }

  return {
    ok: true,
    source: "external_menu",
    created,
    updated,
  };
}
