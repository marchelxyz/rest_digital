/**
 * Синхронизация меню из iiko в Rest Digital.
 * Используется из API роутов superadmin и restaurant.
 */
import { prisma } from "@/lib/db";
import {
  getNomenclature,
  getStopLists,
  getExternalMenus,
  getExternalMenuById,
  type IikoProduct,
  type IikoGroup,
} from "@/lib/iiko/client";
import { getCachedAccessToken } from "@/lib/iiko/token-cache";

export type SyncMenuResult = {
  ok: boolean;
  source: "nomenclature" | "external_menu";
  created: number;
  updated: number;
  revision?: number;
};

/**
 * Синхронизирует меню из iiko для указанного tenant.
 * Сначала пробует nomenclature, при пустом результате — external menu.
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
  const nom = await getNomenclature(token, orgId);
  const stopProductIds = await getStopLists(token, [orgId]);

  if (
    (nom.products ?? []).length === 0 &&
    (nom.productCategories ?? []).length === 0
  ) {
    const externalMenuId =
      settings.iikoExternalMenuId?.trim() ??
      (await _getFirstExternalMenuId(token, orgId));
    if (externalMenuId) {
      const ext = await getExternalMenuById(token, {
        organizationId: orgId,
        externalMenuId,
        priceCategoryId:
          settings.iikoExternalMenuPriceCategoryId?.trim() || undefined,
      });
      return _syncFromExternalMenu(tenantId, ext, stopProductIds);
    }
  }

  return _syncFromNomenclature(tenantId, nom, stopProductIds);
}

async function _getFirstExternalMenuId(
  token: string,
  orgId: string
): Promise<string | null> {
  const menus = await getExternalMenus(token, [orgId]);
  return menus[0]?.id ?? null;
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

  return {
    ok: true,
    source: "nomenclature",
    created,
    updated,
    revision: nom.revision,
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
  const cats = raw.productCategories ?? raw.categories ?? [];
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
