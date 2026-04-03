/**
 * Синхронизация меню из iiko в Rest Digital.
 * Используется из API роутов superadmin и restaurant.
 */
import { prisma } from "@/lib/db";
import {
  getNomenclature,
  getOrganizations,
  getStopLists,
  getExternalMenusForTenant,
  getExternalMenuById,
  type IikoProduct,
  type IikoGroup,
  type IikoExternalMenuData,
  type IikoExternalMenuInfo,
} from "@/lib/iiko/client";
import { getCachedAccessToken } from "@/lib/iiko/token-cache";
import { getExternalMenuCatalogV1 } from "@/lib/iiko/external-menu-v1-catalog";
import { extractExternalMenuProductFields } from "@/lib/iiko/external-menu-extract";

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
 * Достаточно API-ключа Cloud API и организации. Порядок как в mariko_vld: сначала
 * POST /api/1/external_menus и /api/1/external_menu (v1), затем POST /api/2/menu/by_id (v2),
 * затем номенклатура (/api/1/nomenclature). Пустое или заведомо некорректное значение в поле
 * id меню игнорируется.
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

  const token = await getCachedAccessToken(settings.iikoApiLogin.trim());
  const orgConfigured = settings.iikoOrganizationId.trim();
  const { orgId, organizationHint } = await _resolveEffectiveOrganizationId(
    token,
    orgConfigured
  );
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

  /**
   * Как в mariko_vld: сначала POST /api/1/external_menus и /api/1/external_menu (v1),
   * затем уже api/2/menu/by_id и номенклатура. На части стендов v2/by_id и nomenclature пустые,
   * а v1 отдаёт состав меню для сайта iiko.
   */
  try {
    const v1 = await getExternalMenuCatalogV1(token, orgId, externalMenuId || undefined);
    if (v1 && _externalMenuHasContent(v1)) {
      const extResult = await _syncFromExternalMenu(tenantId, v1, stopProductIds);
      return {
        ...extResult,
        hint: _mergeHintStrings(
          organizationHint,
          "Меню загружено через Cloud API v1 (POST /api/1/external_menus, при необходимости /api/1/external_menu), как в mariko_vld."
        ),
      };
    }
  } catch {
    // переходим к v2 и номенклатуре
  }

  /** Если внешнее меню пустое/ошибка — всегда пробуем номенклатуру (как fallback в mariko_vld getMenuCatalog). */
  let externalMenuPrefixHint: string | undefined;

  /** Один запрос /api/1/nomenclature на синк: и для категорий цен в by_id, и для fallback. */
  let nom: Awaited<ReturnType<typeof getNomenclature>> | null = null;

  if (externalMenuId) {
    try {
      nom = await getNomenclature(token, orgId, 0);
    } catch {
      nom = null;
    }
    try {
      const ext = await _loadExternalMenuPayload(
        token,
        orgId,
        externalMenuId,
        settings.iikoExternalMenuPriceCategoryId?.trim() || undefined,
        menus,
        nom
      );
      if (ext && _externalMenuHasContent(ext)) {
        const extResult = await _syncFromExternalMenu(tenantId, ext, stopProductIds);
        return {
          ...extResult,
          hint: _mergeHintStrings(organizationHint, extResult.hint),
        };
      }
      externalMenuPrefixHint =
        "Внешнее меню (POST /api/2/menu/by_id) без позиций — при источнике цен «базовый прайс-лист» в iikoWeb API часто не отдаёт priceCategoryIds; ниже пробуем номенклатуру Cloud API. ";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      externalMenuPrefixHint = `Внешнее меню: ${msg}. Пробуем номенклатуру. `;
    }
  }

  if (nom === null) {
    nom = await getNomenclature(token, orgId, 0);
  }
  return _syncFromNomenclature(tenantId, nom, stopProductIds, {
    externalMenuPrefixHint: _mergeHintStrings(
      organizationHint,
      externalMenuPrefixHint
    ),
  });
}

/**
 * Подставляет organizationId, доступный текущему API-ключу. Иначе stop_lists и by_id
 * падают со старым UUID из БД после смены ключа/ресторана.
 */
async function _resolveEffectiveOrganizationId(
  token: string,
  configuredOrgId: string
): Promise<{ orgId: string; organizationHint?: string }> {
  const orgs = await getOrganizations(token);
  if (orgs.length === 0) {
    throw new Error(
      "По API-ключу не найдено ни одной организации — проверьте ключ в iiko."
    );
  }
  const allowed = new Set(orgs.map((o) => o.id));
  if (allowed.has(configuredOrgId)) {
    return { orgId: configuredOrgId };
  }
  if (orgs.length === 1) {
    const only = orgs[0];
    return {
      orgId: only.id,
      organizationHint: `В настройках указан другой organizationId (${configuredOrgId}); по API-ключу используется «${only.name ?? "организация"}» (${only.id}). Сохраните настройки через «Загрузить из iiko».`,
    };
  }
  throw new Error(
    `organizationId в настройках (${configuredOrgId}) не входит в список организаций этого API-ключа. Нажмите «Загрузить из iiko» и выберите организацию заново.`
  );
}

/** Непустой id внешнего меню (UUID или числовая строка из Cloud API / iiko). */
function _isValidExternalMenuId(value: string): boolean {
  const t = value.trim();
  return t.length > 0 && t.length <= 128;
}

/**
 * Приводит id из настроек к актуальному из POST /api/2/menu (например `76108` → `76108#2`).
 * Если в каталоге только `76108`, а в БД сохранён устаревший `76108#2`, берём базовый id —
 * иначе by_id: External menu id does not belong to your ApiLogin.
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
  const hashIdx = t.indexOf("#");
  if (hashIdx > 0) {
    const base = t.slice(0, hashIdx).trim();
    if (base && menus.some((m) => m.id === base)) {
      return base;
    }
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
 * Составной id из POST /api/2/menu (`76108#2`: внешнее меню + номер/метка категории цен в названии).
 * Для by_id с полным id без UUID категории цен iiko отвечает «Price category id is not correct»;
 * суффикс после `#` не является валидным `priceCategoryId` — нужны UUID из номенклатуры.
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

function _isUuidLike(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value.trim()
  );
}

/**
 * Ставит в начало категорию с индексом (suffix «2» → вторая в списке), если suffix числовой.
 */
function _prioritizePriceCategoriesByCompositeSuffix(
  composite: { suffix: string } | null,
  categories: { id: string; name?: string }[]
): { id: string; name?: string }[] {
  if (!composite || categories.length === 0) {
    return categories;
  }
  const n = Number.parseInt(composite.suffix, 10);
  if (!Number.isFinite(n) || n < 1 || n > categories.length) {
    return categories;
  }
  const preferred = categories[n - 1];
  if (!preferred) {
    return categories;
  }
  const rest = categories.filter((c) => c.id !== preferred.id);
  return [preferred, ...rest];
}

/**
 * В ответе номенклатуры массив `priceCategories` может быть пустым, тогда UUID берут из цен товаров.
 */
function _extractPriceCategoryIdsFromProducts(
  products: IikoProduct[] | undefined
): { id: string }[] {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }
  const ids = new Set<string>();
  for (const p of products) {
    const rows = p.sizePrices;
    if (!Array.isArray(rows)) {
      continue;
    }
    for (const row of rows) {
      const price = row?.price;
      if (!price || typeof price !== "object") {
        continue;
      }
      const pr = price as {
        priceCategoryId?: string;
        PriceCategoryId?: string;
      };
      const pcId = pr.priceCategoryId ?? pr.PriceCategoryId;
      if (typeof pcId === "string" && _isUuidLike(pcId)) {
        ids.add(pcId);
      }
    }
  }
  return [...ids].map((id) => ({ id }));
}

function _mergeNomPriceCategoryCandidates(
  nom: Awaited<ReturnType<typeof getNomenclature>>,
  composite: { suffix: string } | null
): { id: string; name?: string }[] {
  const fromList = nom.priceCategories ?? [];
  const fromProducts = _extractPriceCategoryIdsFromProducts(nom.products);
  const seen = new Set(fromList.map((c) => c.id));
  const merged: { id: string; name?: string }[] = [...fromList];
  for (const c of fromProducts) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      merged.push(c);
    }
  }
  return _prioritizePriceCategoriesByCompositeSuffix(composite, merged);
}

/**
 * Загружает состав внешнего меню, перебирая категории цен: без них iiko часто отдаёт пустой ответ.
 *
 * @param nomPreloaded — результат одного вызова getNomenclature (или null при ошибке); не запрашиваем номенклатуру повторно.
 */
async function _loadExternalMenuPayload(
  token: string,
  organizationId: string,
  externalMenuId: string,
  savedPriceCategoryId: string | undefined,
  menusCache: IikoExternalMenuInfo[] | undefined,
  nomPreloaded: Awaited<ReturnType<typeof getNomenclature>> | null
): Promise<IikoExternalMenuData | null> {
  const menus =
    menusCache ??
    (await getExternalMenusForTenant(token, organizationId).catch(() => []));
  const meta = menus.find((m) => m.id === externalMenuId);

  const composite = _splitCompositeExternalMenuId(externalMenuId);
  const idForListedPriceCategories = composite?.base ?? externalMenuId;

  const prioritizedNom = nomPreloaded
    ? _mergeNomPriceCategoryCandidates(nomPreloaded, composite)
    : [];

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

  const saved = savedPriceCategoryId?.trim();
  if (saved && _isUuidLike(saved)) {
    pushAttempt(externalMenuId, saved);
    pushAttempt(idForListedPriceCategories, saved);
  } else if (saved && !composite) {
    pushAttempt(idForListedPriceCategories, saved);
  }

  for (const pc of meta?.priceCategoryIds ?? []) {
    if (pc) {
      pushAttempt(externalMenuId, pc);
      pushAttempt(idForListedPriceCategories, pc);
    }
  }

  for (const cat of prioritizedNom) {
    if (cat.id && _isUuidLike(cat.id)) {
      pushAttempt(externalMenuId, cat.id);
    }
  }

  /** Не используем `76108` без `#2`: iiko отвечает «does not belong to your ApiLogin». */

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

async function _syncFromNomenclature(
  tenantId: string,
  nom: Awaited<ReturnType<typeof getNomenclature>>,
  stopProductIds: Set<string>,
  options?: { externalMenuPrefixHint?: string }
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

  const triedExternal = Boolean(options?.externalMenuPrefixHint?.trim());
  const hint =
    created === 0 && updated === 0
      ? _nomenclatureEmptyHint(nom, triedExternal)
      : undefined;

  return {
    ok: true,
    source: "nomenclature",
    created,
    updated,
    revision: nom.revision,
    hint: _mergeHintStrings(options?.externalMenuPrefixHint, hint),
  };
}

function _mergeHintStrings(prefix: string | undefined, rest: string | undefined): string | undefined {
  const a = prefix?.trim();
  const b = rest?.trim();
  if (!a && !b) {
    return undefined;
  }
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return `${a} ${b}`;
}

function _nomenclatureEmptyHint(
  nom: Awaited<ReturnType<typeof getNomenclature>>,
  triedExternalMenuFirst: boolean
): string {
  if (triedExternalMenuFirst) {
    const nProd = nom.products?.length ?? 0;
    const nPc = nom.productCategories?.length ?? 0;
    return (
      `Номенклатура Cloud API: products=${nProd}, productCategories=${nPc}. ` +
      "Если products=0 — проверьте выгрузку в облако и права ключа. " +
      "Для внешнего меню с «базовым прайс-листом» укажите UUID категории цен в настройках (iikoOffice: скидки и цены → категории цен) или переключите источник цен на категорию в карточке внешнего меню в iikoWeb."
    );
  }
  return (
    "Использована номенклатура: внешнее меню не загружено (нет меню для организации, пустой ответ API или ошибка при автоподборе). Создайте внешнее меню в iiko и выберите его в настройках ниже."
  );
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
    groups?: { id: string; name: string }[];
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
  const catsBase =
    raw.productCategories ?? raw.categories ?? raw.itemCategories ?? [];
  const seenCatId = new Set(catsBase.map((c) => c.id));
  const cats = [...catsBase];
  for (const g of raw.groups ?? []) {
    if (!seenCatId.has(g.id)) {
      seenCatId.add(g.id);
      cats.push({ id: g.id, name: g.name });
    }
  }
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

    const row = p as Record<string, unknown>;
    const fields = extractExternalMenuProductFields(row);
    const price = fields.priceRub;
    const isOnStopList = stopProductIds.has(p.id);

    const existing = await prisma.product.findFirst({
      where: { tenantId, iikoProductId: p.id },
      include: { modifierGroups: { include: { options: true } } },
    });

    const productData = {
      tenantId,
      categoryId: catId,
      name: p.name,
      description: fields.description,
      allergens: fields.allergens,
      composition: fields.composition,
      calories: fields.calories,
      protein: fields.protein,
      fat: fields.fat,
      carbohydrates: fields.carbohydrates,
      cookingTime: fields.cookingTime,
      weight: fields.weight,
      volume: fields.volume,
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
