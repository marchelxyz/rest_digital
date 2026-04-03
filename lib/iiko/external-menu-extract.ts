/**
 * Извлечение цен и метаданных из сырых объектов блюд iiko Cloud API
 * (внешнее меню v1/v2: разные схемы полей, PascalCase/camelCase).
 */

export type ExternalMenuProductFields = {
  priceRub: number;
  description: string | null;
  allergens: string | null;
  composition: string | null;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbohydrates: number | null;
  cookingTime: number | null;
  weight: string | null;
  volume: string | null;
};

/**
 * Собирает цену в рублях и текстовые/числовые поля для записи в Product из сырого JSON iiko.
 */
export function extractExternalMenuProductFields(
  raw: Record<string, unknown>
): ExternalMenuProductFields {
  return {
    priceRub: extractPriceRubFromRaw(raw),
    description: extractDescriptionFromRaw(raw),
    allergens: extractAllergensFromRaw(raw),
    composition: extractCompositionFromRaw(raw),
    ...extractNutritionFromRaw(raw),
    cookingTime: extractCookingTimeFromRaw(raw),
    ...extractWeightVolumeFromRaw(raw),
  };
}

/**
 * Ищет цену в рублях: верхний уровень, itemSizes/prices, sizePrices, объекты price.currentPrice.
 * Учитывает копейки (целые значения как в номенклатуре).
 */
export function extractPriceRubFromRaw(raw: Record<string, unknown>): number {
  const fromTop = _priceFromUnknown(raw.price ?? raw.Price);
  if (fromTop != null && fromTop > 0) {
    return _round2(fromTop);
  }

  const fromSizes = _priceFromItemSizesArray(
    raw.itemSizes ?? raw.ItemSizes ?? raw.sizes ?? raw.Sizes
  );
  if (fromSizes != null && fromSizes > 0) {
    return _round2(fromSizes);
  }

  const fromSizePrices = _priceFromSizePricesArray(
    raw.sizePrices ?? raw.SizePrices
  );
  if (fromSizePrices != null && fromSizePrices > 0) {
    return _round2(fromSizePrices);
  }

  return 0;
}

function extractDescriptionFromRaw(raw: Record<string, unknown>): string | null {
  const candidates = [
    raw.description,
    raw.Description,
    raw.seoDescription,
    raw.SeoDescription,
    raw.additionalInfo,
    raw.AdditionalInfo,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c.trim();
    }
  }
  return null;
}

function extractAllergensFromRaw(raw: Record<string, unknown>): string | null {
  const direct = raw.allergens ?? raw.Allergens;
  const joined = _stringifyAllergenLike(direct);
  if (joined) {
    return joined;
  }
  const groups = raw.allergenGroups ?? raw.AllergenGroups;
  if (Array.isArray(groups)) {
    const parts: string[] = [];
    for (const g of groups) {
      if (typeof g === "string" && g.trim()) {
        parts.push(g.trim());
      } else if (g && typeof g === "object") {
        const o = g as Record<string, unknown>;
        const n = o.name ?? o.Name;
        if (typeof n === "string" && n.trim()) {
          parts.push(n.trim());
        }
      }
    }
    if (parts.length > 0) {
      return parts.join(", ");
    }
  }
  return null;
}

function extractCompositionFromRaw(raw: Record<string, unknown>): string | null {
  const candidates = [
    raw.composition,
    raw.Composition,
    raw.ingredients,
    raw.Ingredients,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c.trim();
    }
  }
  return null;
}

function extractNutritionFromRaw(raw: Record<string, unknown>): Pick<
  ExternalMenuProductFields,
  "calories" | "protein" | "fat" | "carbohydrates"
> {
  const nested =
    raw.nutritionPerHundredGrams ??
    raw.NutritionPerHundredGrams ??
    raw.nutritionFacts ??
    raw.NutritionFacts;
  if (nested && typeof nested === "object") {
    const o = nested as Record<string, unknown>;
    return {
      calories: _toInt(
        _num(o.energyAmount ?? o.EnergyAmount ?? o.calories ?? o.Calories)
      ),
      protein: _toNullableNum(
        _num(o.proteinsAmount ?? o.ProteinsAmount ?? o.protein ?? o.Protein)
      ),
      fat: _toNullableNum(_num(o.fatAmount ?? o.FatAmount ?? o.fat ?? o.Fat)),
      carbohydrates: _toNullableNum(
        _num(
          o.carbohydratesAmount ??
            o.CarbohydratesAmount ??
            o.carbohydrates ??
            o.Carbohydrates
        )
      ),
    };
  }
  return {
    calories: _toInt(
      _num(
        raw.calories ??
          raw.Calories ??
          raw.energyAmount ??
          raw.EnergyAmount ??
          raw.energy
      )
    ),
    protein: _toNullableNum(
      _num(
        raw.proteinsAmount ??
          raw.ProteinsAmount ??
          raw.protein ??
          raw.Protein
      )
    ),
    fat: _toNullableNum(_num(raw.fatAmount ?? raw.FatAmount ?? raw.fat ?? raw.Fat)),
    carbohydrates: _toNullableNum(
      _num(
        raw.carbohydratesAmount ??
          raw.CarbohydratesAmount ??
          raw.carbohydrates ??
          raw.Carbohydrates
      )
    ),
  };
}

function extractCookingTimeFromRaw(raw: Record<string, unknown>): number | null {
  const v = _num(
    raw.cookingTime ?? raw.CookingTime ?? raw.preparationTime ?? raw.PreparationTime
  );
  if (v == null || !Number.isFinite(v)) {
    return null;
  }
  const n = Math.round(v);
  return n > 0 ? n : null;
}

function extractWeightVolumeFromRaw(
  raw: Record<string, unknown>
): Pick<ExternalMenuProductFields, "weight" | "volume"> {
  const w =
    raw.weight ?? raw.Weight ?? raw.portionWeightGrams ?? raw.PortionWeightGrams;
  const vol = raw.volume ?? raw.Volume;
  let weight: string | null = null;
  if (typeof w === "string" && w.trim()) {
    weight = w.trim();
  } else if (typeof w === "number" && Number.isFinite(w) && w > 0) {
    weight = `${Math.round(w)} г`;
  }
  let volume: string | null = null;
  if (typeof vol === "string" && vol.trim()) {
    volume = vol.trim();
  } else if (typeof vol === "number" && Number.isFinite(vol) && vol > 0) {
    volume = `${vol} л`;
  }
  return { weight, volume };
}

function _stringifyAllergenLike(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

function _priceFromItemSizesArray(value: unknown): number | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  let best: number | null = null;
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const row = entry as Record<string, unknown>;
    const isDefault = row.isDefault ?? row.IsDefault;
    const prices = (row.prices ?? row.Prices) as unknown;
    const fromPrices = _firstPriceFromPricesArray(prices);
    if (fromPrices != null && fromPrices > 0) {
      if (isDefault === true) {
        return fromPrices;
      }
      if (best == null || fromPrices > best) {
        best = fromPrices;
      }
    }
    const single = _priceFromUnknown(row.price ?? row.Price);
    if (single != null && single > 0) {
      if (isDefault === true) {
        return single;
      }
      if (best == null || single > best) {
        best = single;
      }
    }
  }
  return best;
}

function _firstPriceFromPricesArray(prices: unknown): number | null {
  if (!Array.isArray(prices) || prices.length === 0) {
    return null;
  }
  for (const pr of prices) {
    if (!pr || typeof pr !== "object") {
      continue;
    }
    const o = pr as Record<string, unknown>;
    const nested = _priceFromUnknown(o.price ?? o.Price);
    if (nested != null && nested > 0) {
      return nested;
    }
  }
  return null;
}

function _priceFromSizePricesArray(value: unknown): number | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  for (const row of value) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const r = row as Record<string, unknown>;
    const p = _priceFromUnknown(r.price ?? r.Price);
    if (p != null && p > 0) {
      return p;
    }
  }
  return null;
}

function _priceFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return _normalizeKopecksToRubles(value);
  }
  if (!value || typeof value !== "object") {
    return null;
  }
  const o = value as Record<string, unknown>;
  const cur = o.currentPrice ?? o.CurrentPrice;
  if (typeof cur === "number" && Number.isFinite(cur)) {
    return _normalizeKopecksToRubles(cur);
  }
  return null;
}

/**
 * Внешнее меню iiko отдаёт цену по-разному: часто `currentPrice` в копейках (как номенклатура),
 * но для целых рублей без копеек встречается **1000** как «1000 ₽» (например цена за кг), а не 100000 коп.
 * Раньше любое целое ≥1000 делилось на 100 → 1000 превращалось в 10 ₽.
 *
 * Правило: явно копейки — значения ≥100000 (1000+ ₽ в минорных единицах) и диапазоны 1000–99999
 * кроме **ровно 1000**, которое трактуем как 1000 ₽ (типичный кейс «1000 за кг» из Cloud API).
 */
function _normalizeKopecksToRubles(n: number): number {
  if (n <= 0) {
    return 0;
  }
  if (!Number.isInteger(n)) {
    return n;
  }
  if (n >= 100_000) {
    return n / 100;
  }
  if (n === 1000) {
    return 1000;
  }
  if (n > 1000) {
    return n / 100;
  }
  return n / 100;
}

function _round2(n: number): number {
  return Number(n.toFixed(2));
}

function _num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function _toInt(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  const n = Math.round(value);
  return n > 0 ? n : null;
}

function _toNullableNum(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  return Number(value.toFixed(2));
}
