/**
 * POST /api/superadmin/tenants/[tenantId]/menu/import-excel
 * Импорт меню из Excel (.xlsx) в БД (режим без POS).
 *
 * Ожидаемые колонки (первая строка заголовки):
 * - category (обязательно)
 * - name (обязательно)
 * - price (обязательно)
 * - description (опционально)
 * - dops (опционально): JSON массива групп модификаторов
 * - calories, protein, fat, carbohydrates (опционально)
 * - cookingTime (опционально)
 * - composition (опционально)
 *
 * Поле для ссылки на фото в Excel НЕ используется (фото задаётся из библиотеки отдельно).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSuperadmin } from "@/lib/auth";
import * as XLSX from "xlsx";
import { Decimal } from "@prisma/client/runtime/library";

type DopGroupJson = {
  name: string;
  type?: "single" | "multiple" | "quantity";
  isRequired?: boolean;
  minSelect?: number;
  maxSelect?: number;
  sortOrder?: number;
  isActive?: boolean;
  options?: {
    name: string;
    priceDelta?: number;
    isDefault?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  }[];
};

type Row = {
  category?: string;
  name?: string;
  price?: number | string;
  description?: string;
  dops?: string;
  calories?: number | string;
  protein?: number | string;
  fat?: number | string;
  carbohydrates?: number | string;
  cookingTime?: number | string;
  composition?: string;
};

function parseNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(",", ".").replace(/[^\d.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parsePrice(value: unknown): number | null {
  return parseNumber(value);
}

function parseDopsCell(value: unknown): DopGroupJson[] {
  if (value == null) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw) as DopGroupJson[];
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { tenantId } = await params;

  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } });
  if (!settings || settings.posProvider !== "none" || settings.menuSource !== "excel") {
    return NextResponse.json(
      { error: "Импорт из Excel доступен только в режиме без POS (posProvider=none, menuSource=excel)" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file обязателен" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "Нужен файл .xlsx" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!sheet) return NextResponse.json({ error: "Не удалось прочитать первый лист" }, { status: 400 });

  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
  if (!rows.length) return NextResponse.json({ error: "Файл пустой" }, { status: 400 });

  const categoryCache = new Map<string, string>();

  let createdProducts = 0;
  let updatedProducts = 0;
  let createdCategories = 0;

  const touchedProducts: { id: string; name: string; categoryName: string }[] = [];

  for (const r of rows) {
    const categoryName = String(r.category ?? "").trim();
    const name = String(r.name ?? "").trim();
    const priceNumber = parsePrice(r.price);

    if (!categoryName || !name || priceNumber == null) continue;

    let categoryId = categoryCache.get(categoryName);
    if (!categoryId) {
      const existing = await prisma.category.findFirst({
        where: { tenantId, name: categoryName },
        select: { id: true },
      });
      if (existing) {
        categoryId = existing.id;
      } else {
        const created = await prisma.category.create({
          data: {
            tenantId,
            name: categoryName,
            sortOrder: 0,
            isActive: true,
            isPublished: true,
          },
          select: { id: true },
        });
        categoryId = created.id;
        createdCategories += 1;
      }
      categoryCache.set(categoryName, categoryId);
    }

    const description = String(r.description ?? "").trim() || null;
    const composition = String(r.composition ?? "").trim() || null;

    const calories = parseNumber(r.calories);
    const protein = parseNumber(r.protein);
    const fat = parseNumber(r.fat);
    const carbohydrates = parseNumber(r.carbohydrates);

    const cookingTime = parseNumber(r.cookingTime);

    let dops: DopGroupJson[] = [];
    const dopsRaw = r.dops;
    if (dopsRaw != null && String(dopsRaw).trim()) {
      try {
        dops = parseDopsCell(dopsRaw);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json(
          { error: `Некорректный JSON в колонке dops для блюда "${name}": ${msg}` },
          { status: 400 }
        );
      }
    }

    const existingProduct = await prisma.product.findFirst({
      where: { tenantId, name, categoryId: categoryId! },
      select: { id: true },
    });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          price: new Decimal(priceNumber),
          description,
          composition,
          calories: calories != null ? calories : null,
          protein: protein != null ? new Decimal(protein) : null,
          fat: fat != null ? new Decimal(fat) : null,
          carbohydrates: carbohydrates != null ? new Decimal(carbohydrates) : null,
          cookingTime: cookingTime != null ? cookingTime : null,
          isActive: true,
          isAvailable: true,
          isPublished: true,
        },
      });
      updatedProducts += 1;

      await prisma.modifierGroup.deleteMany({ where: { productId: existingProduct.id, tenantId } });
      for (const g of dops) {
        const group = await prisma.modifierGroup.create({
          data: {
            tenantId,
            productId: existingProduct.id,
            name: g.name,
            type: g.type ?? "single",
            isRequired: g.isRequired ?? false,
            minSelect: g.minSelect ?? (g.isRequired ? 1 : 0),
            maxSelect: g.maxSelect ?? (g.type === "single" ? 1 : 10),
            sortOrder: g.sortOrder ?? 0,
            isActive: g.isActive ?? true,
          },
        });
        for (const o of g.options ?? []) {
          await prisma.modifierOption.create({
            data: {
              tenantId,
              modifierGroupId: group.id,
              name: o.name,
              priceDelta: new Decimal(o.priceDelta ?? 0),
              isDefault: o.isDefault ?? false,
              isActive: o.isActive ?? true,
              sortOrder: o.sortOrder ?? 0,
            },
          });
        }
      }
      touchedProducts.push({ id: existingProduct.id, name, categoryName });
    } else {
      const created = await prisma.product.create({
        data: {
          tenantId,
          categoryId: categoryId!,
          name,
          price: new Decimal(priceNumber),
          description,
          composition,
          calories: calories != null ? calories : null,
          protein: protein != null ? new Decimal(protein) : null,
          fat: fat != null ? new Decimal(fat) : null,
          carbohydrates: carbohydrates != null ? new Decimal(carbohydrates) : null,
          cookingTime: cookingTime != null ? cookingTime : null,
          sortOrder: 0,
          isActive: true,
          isAvailable: true,
          isPublished: true,
          imageUrl: null,
          isSpicy: false,
          isNew: false,
          isPopular: false,
          isRecommended: false,
          isVegan: false,
          isVegetarian: false,
          isGlutenFree: false,
          isHit: false,
          isDiscounted: false,
          modifierGroups: dops.length
            ? {
                create: dops.map((g) => ({
                  tenantId,
                  name: g.name,
                  type: g.type ?? "single",
                  isRequired: g.isRequired ?? false,
                  minSelect: g.minSelect ?? (g.isRequired ? 1 : 0),
                  maxSelect: g.maxSelect ?? (g.type === "single" ? 1 : 10),
                  sortOrder: g.sortOrder ?? 0,
                  isActive: g.isActive ?? true,
                  options: {
                    create: (g.options ?? []).map((o) => ({
                      tenantId,
                      name: o.name,
                      priceDelta: new Decimal(o.priceDelta ?? 0),
                      isDefault: o.isDefault ?? false,
                      isActive: o.isActive ?? true,
                      sortOrder: o.sortOrder ?? 0,
                    })),
                  },
                })),
              }
            : undefined,
        },
        select: { id: true },
      });
      createdProducts += 1;
      touchedProducts.push({ id: created.id, name, categoryName });
    }
  }

  return NextResponse.json({
    ok: true,
    createdCategories,
    createdProducts,
    updatedProducts,
    products: touchedProducts,
  });
}

