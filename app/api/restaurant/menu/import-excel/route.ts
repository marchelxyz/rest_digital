/**
 * POST /api/restaurant/menu/import-excel
 * Импорт меню из Excel (.xlsx) в кабинет партнёра (без POS-интеграции).
 *
 * Ожидаемые колонки (первая строка заголовки):
 * - category (обязательно)
 * - name (обязательно)
 * - price (обязательно)
 * - description (опционально)
 * - imageUrl (опционально)
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getEmployee } from "@/lib/auth";
import * as XLSX from "xlsx";
import { Decimal } from "@prisma/client/runtime/library";

type Row = {
  category?: string;
  name?: string;
  price?: number | string;
  description?: string;
  imageUrl?: string;
};

function parsePrice(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(",", ".").replace(/[^\d.]/g, "");
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId: emp.tenantId },
    create: { tenantId: emp.tenantId },
    update: {},
  });
  if (settings.menuSource !== "excel" || settings.posProvider !== "none") {
    return NextResponse.json(
      { error: "Импорт из Excel доступен только в режиме без POS-интеграции" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "file обязателен" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "Нужен файл .xlsx" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!sheet) {
    return NextResponse.json({ error: "Не удалось прочитать первый лист" }, { status: 400 });
  }

  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
  if (rows.length === 0) {
    return NextResponse.json({ error: "Файл пустой" }, { status: 400 });
  }

  const categoryCache = new Map<string, { id: string }>();
  let createdCategories = 0;
  let createdProducts = 0;
  let updatedProducts = 0;

  for (const r of rows) {
    const categoryName = String(r.category ?? "").trim();
    const name = String(r.name ?? "").trim();
    const priceNumber = parsePrice(r.price);
    if (!categoryName || !name || priceNumber == null) continue;

    let cat = categoryCache.get(categoryName);
    if (!cat) {
      const existing = await prisma.category.findFirst({
        where: { tenantId: emp.tenantId, name: categoryName },
        select: { id: true },
      });
      if (existing) {
        cat = existing;
      } else {
        const created = await prisma.category.create({
          data: {
            tenantId: emp.tenantId,
            name: categoryName,
            sortOrder: 0,
            isActive: true,
            isPublished: true,
          },
          select: { id: true },
        });
        cat = created;
        createdCategories += 1;
      }
      categoryCache.set(categoryName, cat);
    }

    const description = String(r.description ?? "").trim();
    const imageUrl = String(r.imageUrl ?? "").trim();

    const existingProduct = await prisma.product.findFirst({
      where: { tenantId: emp.tenantId, name, categoryId: cat.id },
      select: { id: true },
    });
    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          price: new Decimal(priceNumber),
          description: description || null,
          imageUrl: imageUrl || null,
          isActive: true,
          isAvailable: true,
          isPublished: true,
        },
      });
      updatedProducts += 1;
    } else {
      await prisma.product.create({
        data: {
          tenantId: emp.tenantId,
          categoryId: cat.id,
          name,
          price: new Decimal(priceNumber),
          description: description || null,
          imageUrl: imageUrl || null,
          sortOrder: 0,
          isActive: true,
          isAvailable: true,
          isPublished: true,
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
      });
      createdProducts += 1;
    }
  }

  return NextResponse.json({
    createdCategories,
    createdProducts,
    updatedProducts,
  });
}

