/**
 * GET /api/superadmin/tenants/[tenantId]/menu/import-excel-template
 * Скачать шаблон Excel для загрузки меню (без фото-ссылок).
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

  const columns = [
    "category",
    "name",
    "price",
    "description",
    "dops",
    "calories",
    "protein",
    "fat",
    "carbohydrates",
    "cookingTime",
    "composition",
  ];

  const ws = XLSX.utils.aoa_to_sheet([columns]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "menu");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rest-digital-menu-template.xlsx"`,
    },
  });
}

