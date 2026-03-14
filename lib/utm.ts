/**
 * Сбор UTM-меток из URL при загрузке и хранение в sessionStorage.
 */

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type UtmParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
};

const STORAGE_KEY = "rd_utm_params";

function parseUtmFromSearch(search: string): UtmParams {
  const params = new URLSearchParams(search);
  const out: UtmParams = {};
  const map: Record<string, keyof UtmParams> = {
    utm_source: "utmSource",
    utm_medium: "utmMedium",
    utm_campaign: "utmCampaign",
    utm_term: "utmTerm",
    utm_content: "utmContent",
  };
  for (const key of UTM_KEYS) {
    const v = params.get(key);
    if (v) (out as Record<string, string>)[map[key]] = v;
  }
  return out;
}

/**
 * Извлекает UTM из текущего URL и сохраняет в sessionStorage.
 * Вызывается при загрузке клиентского приложения.
 */
export function captureUtmFromUrl(): UtmParams {
  if (typeof window === "undefined") return {};
  const parsed = parseUtmFromSearch(window.location.search);
  if (Object.keys(parsed).length > 0) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // ignore
    }
  }
  return getStoredUtm();
}

/**
 * Возвращает сохранённые UTM (из sessionStorage или текущего URL).
 */
export function getStoredUtm(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UtmParams;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // ignore
  }
  return parseUtmFromSearch(window.location.search);
}
