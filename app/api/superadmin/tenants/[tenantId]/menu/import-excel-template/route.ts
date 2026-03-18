/**
 * GET /api/superadmin/tenants/[tenantId]/menu/import-excel-template
 * Скачать шаблон Excel для загрузки меню и допов (2 листа, без фото-ссылок).
 */
import { NextRequest, NextResponse } from "next/server";
import { getSuperadmin } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tenantId: string }> }) {
  const admin = await getSuperadmin();
  if (!admin || admin.type !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await params;

  const menuColumns = [
    "sku",
    "category",
    "name",
    "price",
    "description",
    "calories",
    "protein",
    "fat",
    "carbohydrates",
    "cookingTime",
    "composition",
  ];

  const modifierColumns = [
    // Связь с блюдом: sku предпочтительно, но также поддержим productName+category
    "sku",
    "productName",
    "category",
    // Группа/доп
    "groupName",
    "groupType",
    "isRequired",
    "minSelect",
    "maxSelect",
    // Вариант группы
    "optionName",
    "priceDelta",
    "isDefault",
    "sortOrder",
    // KBJU/время/состав (для размеров/вариантов)
    "calories",
    "protein",
    "fat",
    "carbohydrates",
    "cookingTime",
    "composition",
  ];

  const wsMenu = XLSX.utils.aoa_to_sheet([menuColumns]);
  const wsModifiers = XLSX.utils.aoa_to_sheet([modifierColumns]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMenu, "menu");
  XLSX.utils.book_append_sheet(wb, wsModifiers, "modifier_groups");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rest-digital-menu-template.xlsx"`,
    },
  });
}

