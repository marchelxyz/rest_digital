/**
 * POST /api/superadmin/tenants/[tenantId]/iiko/sync-menu
 * Синхронизация меню из iiko (nomenclature → Category, Product, ModifierGroup, ModifierOption)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperadmin } from "@/lib/auth";
import {
  getAccessToken,
  getNomenclature,
  getStopLists,
  type IikoProduct,
  type IikoGroup,
} from "@/lib/iiko/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });
  if (!settings?.iikoApiLogin?.trim() || !settings?.iikoOrganizationId?.trim()) {
    return NextResponse.json(
      { error: "iikoApiLogin и iikoOrganizationId должны быть заданы" },
      { status: 400 }
    );
  }

  try {
    const token = await getAccessToken(settings.iikoApiLogin.trim());
    const nom = await getNomenclature(token, settings.iikoOrganizationId.trim());

    const stopProductIds = await getStopLists(token, [settings.iikoOrganizationId.trim()]);

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
      const priceVal = sp && typeof sp === "object" && "price" in sp
        ? (sp as { price?: { currentPrice?: number } }).price?.currentPrice
        : (sp as { currentPrice?: number } | undefined)?.currentPrice;
      const price = typeof priceVal === "number" ? priceVal / 100 : 0;
      const categoryId = categoryByName.get(
        nom.productCategories?.find((c) => c.id === p.productCategoryId)?.name ?? "Прочее"
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
          let modGroup = existing.modifierGroups.find((mg) => mg.iikoProductGroupId === gm.id) as
            | { id: string; options?: { iikoProductId: string | null }[] }
            | undefined;
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
            const modPrice = modProduct?.sizePrices?.[0]?.price?.currentPrice != null
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
            const modPrice = modProduct?.sizePrices?.[0]?.price?.currentPrice != null
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

    return NextResponse.json({
      ok: true,
      created,
      updated,
      revision: nom.revision,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
