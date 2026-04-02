/**
 * Человекочитаемые подписи для результата синхронизации меню iiko (используются в UI).
 */

export type IikoSyncMenuSource = "nomenclature" | "external_menu";

/** Русская подпись источника данных для партнёрского кабинета. */
export function formatIikoSyncSourceRu(source: string): string {
  if (source === "external_menu") {
    return "внешнее меню iiko";
  }
  if (source === "nomenclature") {
    return "номенклатура iiko";
  }
  return source;
}
