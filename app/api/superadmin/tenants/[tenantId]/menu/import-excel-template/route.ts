/**
 * GET /api/superadmin/tenants/[tenantId]/menu/import-excel-template
 * Скачать шаблон Excel для загрузки меню и допов (4 листа):
 * - 2 листа с полностью заполненными примерами (menu_example, modifier_groups_example)
 * - 2 листа для заполнения (menu, modifier_groups)
 * Фото в Excel не указываются (назначаются из библиотеки).
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

  // Листы-примеры (полностью заполненные поля на русском)
  const menuExampleRows = [
    menuColumns,
    [
      "BURGER_CHEESE_MED",
      "Бургеры",
      "Чизбургер (средний)",
      500,
      "Сочный чизбургер с говядиной, сыром и фирменным соусом",
      620,
      30,
      33,
      45,
      14,
      "Говядина, сыр, булочка, соус, салат",
    ],
  ];

  const modifierExampleRows = [
    modifierColumns,
    [
      "BURGER_CHEESE_MED",
      "",
      "",
      "Размер",
      "single",
      true,
      1,
      1,
      "Маленькое",
      -50,
      true,
      0,
      520,
      26,
      28,
      38,
      12,
      "Говядина, сыр, булочка, соус, салат",
    ],
    [
      "BURGER_CHEESE_MED",
      "",
      "",
      "Размер",
      "single",
      true,
      1,
      1,
      "Среднее",
      0,
      false,
      1,
      620,
      30,
      33,
      45,
      14,
      "Говядина, сыр, булочка, соус, салат",
    ],
    [
      "BURGER_CHEESE_MED",
      "",
      "",
      "Размер",
      "single",
      true,
      1,
      1,
      "Большое",
      150,
      false,
      2,
      760,
      37,
      40,
      55,
      16,
      "Говядина, сыр, булочка, соус, салат",
    ],
  ];

  const wsMenuExample = XLSX.utils.aoa_to_sheet(menuExampleRows);
  const wsModifiersExample = XLSX.utils.aoa_to_sheet(modifierExampleRows);

  // Листы для заполнения: только заголовки
  const wsMenuToFill = XLSX.utils.aoa_to_sheet([menuColumns]);
  const wsModifiersToFill = XLSX.utils.aoa_to_sheet([modifierColumns]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMenuExample, "menu_example");
  XLSX.utils.book_append_sheet(wb, wsModifiersExample, "modifier_groups_example");
  XLSX.utils.book_append_sheet(wb, wsMenuToFill, "menu");
  XLSX.utils.book_append_sheet(wb, wsModifiersToFill, "modifier_groups");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rest-digital-menu-template.xlsx"`,
    },
  });
}

