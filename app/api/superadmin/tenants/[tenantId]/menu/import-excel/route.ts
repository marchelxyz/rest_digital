/**
 * POST /api/superadmin/tenants/[tenantId]/menu/import-excel
 * Импорт меню из Excel (.xlsx) в БД (режим без POS).
 *
 * Ожидаемый формат:
 * - Лист `menu`: блюда (category/name/price + KBJU/время/состав)
 * - Лист `modifier_groups`: допы/группы/опции (с параметрами KBJU/время/состав для размеров)
 *
 * Поле для ссылки на фото в Excel НЕ используется (фото задаётся из библиотеки отдельно).
 *
 * Обратно совместимо:
 * - если лист `modifier_groups` отсутствует, попробуем прочитать колонку `dops` в листе `menu` (старый формат через JSON).
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

type MenuRow = {
  sku?: string;
  category?: string;
  name?: string;
  price?: number | string;
  description?: string;
  dops?: string; // старый формат (JSON)
  calories?: number | string;
  protein?: number | string;
  fat?: number | string;
  carbohydrates?: number | string;
  cookingTime?: number | string;
  composition?: string;
};

type ModifierGroupRow = {
  sku?: string;
  productName?: string;
  category?: string;

  groupName?: string;
  groupType?: string;
  isRequired?: unknown;
  minSelect?: unknown;
  maxSelect?: unknown;

  optionName?: string;
  priceDelta?: number | string;
  isDefault?: unknown;
  sortOrder?: unknown;

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

function parseIntOrNull(value: unknown): number | null {
  const n = parseNumber(value);
  if (n == null) return null;
  return Math.trunc(n);
}

function parseBoolOrNull(value: unknown): boolean | null {
  if (value == null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "да", "нужно", "обязательно"].includes(s)) return true;
  if (["0", "false", "no", "n", "нет"].includes(s)) return false;
  return null;
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

  const sheetMenu =
    wb.Sheets["menu"] ??
    (wb.SheetNames.length > 0 ? wb.Sheets[wb.SheetNames[0]] : undefined);
  const sheetModifiers = wb.Sheets["modifier_groups"];

  if (!sheetMenu) {
    return NextResponse.json({ error: "Не удалось прочитать лист `menu`" }, { status: 400 });
  }

  const menuRows = XLSX.utils.sheet_to_json<MenuRow>(sheetMenu, { defval: "" });
  if (!menuRows.length) return NextResponse.json({ error: "Файл пустой (menu)" }, { status: 400 });

  const modifierRows = sheetModifiers
    ? XLSX.utils.sheet_to_json<ModifierGroupRow>(sheetModifiers, { defval: "" })
    : [];

  const categoryCache = new Map<string, string>();
  const productIdBySku = new Map<string, string>();
  const productIdByNameCategory = new Map<string, string>();

  let createdProducts = 0;
  let updatedProducts = 0;
  let createdCategories = 0;

  const touchedProducts: { id: string; name: string; categoryName: string }[] = [];

  async function getOrCreateCategory(categoryName: string) {
    const cached = categoryCache.get(categoryName);
    if (cached) return cached;
    const existing = await prisma.category.findFirst({
      where: { tenantId, name: categoryName },
      select: { id: true },
    });
    if (existing) {
      categoryCache.set(categoryName, existing.id);
      return existing.id;
    }
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
    categoryCache.set(categoryName, created.id);
    createdCategories += 1;
    return created.id;
  }

  for (const r of menuRows) {
    const categoryName = String(r.category ?? "").trim();
    const name = String(r.name ?? "").trim();
    const priceNumber = parsePrice(r.price);
    const sku = String(r.sku ?? "").trim();

    if (!categoryName || !name || priceNumber == null) continue;

    const categoryId = await getOrCreateCategory(categoryName);
    const description = String(r.description ?? "").trim() || null;
    const composition = String(r.composition ?? "").trim() || null;
    const calories = parseNumber(r.calories);
    const protein = parseNumber(r.protein);
    const fat = parseNumber(r.fat);
    const carbohydrates = parseNumber(r.carbohydrates);
    const cookingTime = parseIntOrNull(r.cookingTime);

    const existingProduct = sku
      ? await prisma.product.findFirst({ where: { tenantId, sku }, select: { id: true } })
      : await prisma.product.findFirst({
          where: { tenantId, name, categoryId },
          select: { id: true },
        });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          sku: sku || undefined,
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
      touchedProducts.push({ id: existingProduct.id, name, categoryName });
      if (sku) productIdBySku.set(sku, existingProduct.id);
      productIdByNameCategory.set(`${name}|||${categoryName}`, existingProduct.id);
    } else {
      const created = await prisma.product.create({
        data: {
          tenantId,
          categoryId,
          sku: sku || undefined,
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
        },
        select: { id: true },
      });
      createdProducts += 1;
      touchedProducts.push({ id: created.id, name, categoryName });
      if (sku) productIdBySku.set(sku, created.id);
      productIdByNameCategory.set(`${name}|||${categoryName}`, created.id);
    }
  }

  // Если есть second sheet — импортируем допы оттуда.
  // Иначе — используем старый колонковый `dops` (JSON).
  const hasModifierSheet = modifierRows.length > 0;

  if (hasModifierSheet) {
    type OptionDraft = {
      name: string;
      priceDelta: number;
      isDefault: boolean;
      sortOrder: number;
      calories?: number | null;
      protein?: number | null;
      fat?: number | null;
      carbohydrates?: number | null;
      cookingTime?: number | null;
      composition?: string | null;
    };
    type GroupDraft = {
      productId: string;
      name: string;
      type: "single" | "multiple" | "quantity";
      isRequired: boolean;
      minSelect: number;
      maxSelect: number;
      sortOrder: number;
      isActive: boolean;
      options: OptionDraft[];
    };

    const groupByKey = new Map<string, GroupDraft>();

    function resolveProductId(row: ModifierGroupRow): string | null {
      const sku = String(row.sku ?? "").trim();
      if (sku) return productIdBySku.get(sku) ?? null;
      const productName = String(row.productName ?? "").trim();
      const categoryName = String(row.category ?? "").trim();
      if (!productName) return null;
      const key = categoryName ? `${productName}|||${categoryName}` : `${productName}|||`;
      return productIdByNameCategory.get(key) ?? null;
    }

    function normalizeType(input: string | undefined): "single" | "multiple" | "quantity" {
      const s = String(input ?? "").trim().toLowerCase();
      if (s === "single" || s === "multiple" || s === "quantity") return s;
      return "single";
    }

    for (const row of modifierRows) {
      const optionName = String(row.optionName ?? "").trim();
      const groupName = String(row.groupName ?? "").trim();
      if (!optionName || !groupName) continue;

      const productId = resolveProductId(row);
      if (!productId) continue;

      const groupType = normalizeType(
        row.groupType ? String(row.groupType) : undefined
      );
      const isRequired = parseBoolOrNull(row.isRequired) ?? false;
      const minSelect = parseIntOrNull(row.minSelect) ?? (isRequired ? 1 : 0);
      const maxSelect =
        parseIntOrNull(row.maxSelect) ??
        (groupType === "single" ? 1 : groupType === "quantity" ? 10 : 10);
      const sortOrder = parseIntOrNull(row.sortOrder) ?? 0;
      const priceDelta = parsePrice(row.priceDelta) ?? 0;
      const isDefault = parseBoolOrNull(row.isDefault) ?? false;

      const calories = parseIntOrNull(row.calories);
      const protein = parseNumber(row.protein);
      const fat = parseNumber(row.fat);
      const carbohydrates = parseNumber(row.carbohydrates);
      const cookingTime = parseIntOrNull(row.cookingTime);
      const composition = String(row.composition ?? "").trim() || null;

      const optionSortOrder = sortOrder; // reuse if provided
      const option: OptionDraft = {
        name: optionName,
        priceDelta,
        isDefault,
        sortOrder: optionSortOrder,
        calories,
        protein,
        fat,
        carbohydrates,
        cookingTime,
        composition,
      };

      const key = `${productId}|||${groupName}|||${groupType}|||${isRequired}|||${minSelect}|||${maxSelect}|||${sortOrder}`;
      const existing = groupByKey.get(key);
      if (!existing) {
        groupByKey.set(key, {
          productId,
          name: groupName,
          type: groupType,
          isRequired,
          minSelect,
          maxSelect,
          sortOrder,
          isActive: true,
          options: [option],
        });
      } else {
        existing.options.push(option);
      }
    }

    const productIds = new Set<string>(Array.from(groupByKey.values()).map((g) => g.productId));
    for (const pid of productIds) {
      await prisma.modifierGroup.deleteMany({ where: { tenantId, productId: pid } });
    }

    for (const g of groupByKey.values()) {
      const group = await prisma.modifierGroup.create({
        data: {
          tenantId,
          productId: g.productId,
          name: g.name,
          type: g.type,
          isRequired: g.isRequired,
          minSelect: g.minSelect,
          maxSelect: g.maxSelect,
          sortOrder: g.sortOrder,
          isActive: g.isActive,
        },
      });

      // Create options for this group
      for (const opt of g.options) {
        await prisma.modifierOption.create({
          data: {
            tenantId,
            modifierGroupId: group.id,
            name: opt.name,
            priceDelta: new Decimal(opt.priceDelta),
            isDefault: opt.isDefault,
            isActive: true,
            sortOrder: opt.sortOrder,
            calories: opt.calories ?? null,
            protein: opt.protein != null ? new Decimal(opt.protein) : null,
            fat: opt.fat != null ? new Decimal(opt.fat) : null,
            carbohydrates: opt.carbohydrates != null ? new Decimal(opt.carbohydrates) : null,
            cookingTime: opt.cookingTime ?? null,
            composition: opt.composition ?? null,
          },
        });
      }
    }
  } else {
    // Backward compatible: old `dops` JSON stored per dish row.
    for (const r of menuRows) {
      const categoryName = String(r.category ?? "").trim();
      const name = String(r.name ?? "").trim();
      const sku = String(r.sku ?? "").trim();
      if (!categoryName || !name) continue;

      const productId = sku
        ? productIdBySku.get(sku)
        : productIdByNameCategory.get(`${name}|||${categoryName}`);
      if (!productId) continue;

      const dopsRaw = r.dops;
      if (!dopsRaw || !String(dopsRaw).trim()) continue;

      let dops: DopGroupJson[] = [];
      try {
        dops = parseDopsCell(dopsRaw);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: `Некорректный JSON в dops для блюда "${name}": ${msg}` }, { status: 400 });
      }

      await prisma.modifierGroup.deleteMany({ where: { tenantId, productId } });
      for (const g of dops) {
        const group = await prisma.modifierGroup.create({
          data: {
            tenantId,
            productId,
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

