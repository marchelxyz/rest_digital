"use client";

import { ExternalLink } from "lucide-react";
import type { Settings } from "./ClientApp";

export function ClientInfoTab({ settings }: { settings: Settings }) {
  const links = [
    { label: "Условия проведения акций", url: settings.infoTermsUrl },
    { label: "Частые вопросы", url: settings.infoFaqUrl },
    { label: "Стать партнером", url: settings.infoPartnerUrl },
    { label: "Таблица калорийности", url: settings.infoCaloriesUrl },
  ].filter((l) => l.url);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-3 border-b"
            >
              {l.label}
              <ExternalLink size={14} className="opacity-60 shrink-0" />
            </a>
          ))}
        </div>
      )}

      {(settings.infoAddress || settings.infoHours) && (
        <div>
          {settings.infoAddress && <div className="font-medium">{settings.infoAddress}</div>}
          {settings.infoHours && (
            <div className="text-sm opacity-70 mt-1">{settings.infoHours}</div>
          )}
        </div>
      )}

      <div className="p-4 rounded-xl border">
        <div className="font-medium mb-2">
          {settings.infoContactText ?? "Проблемы с заказом или появился вопрос? Напишите нам!"}
        </div>
        {settings.infoPhone && (
          <a href={`tel:${settings.infoPhone}`} className="block text-lg">
            {settings.infoPhone}
          </a>
        )}
        <div className="flex gap-4 mt-3 items-center">
          {settings.infoSocialInstagram && (
            <a
              href={settings.infoSocialInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm"
            >
              Instagram
            </a>
          )}
          {settings.infoSocialTelegram && (
            <a
              href={settings.infoSocialTelegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-full opacity-80 hover:opacity-100 transition-opacity"
              aria-label="Telegram"
            >
              <img src="/telegram.svg" alt="" className="w-6 h-6" width={24} height={24} />
            </a>
          )}
          {settings.infoSocialVk && (
            <a
              href={settings.infoSocialVk}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-full opacity-80 hover:opacity-100 transition-opacity"
              aria-label="ВКонтакте"
            >
              <img src="/vk.svg" alt="" className="w-6 h-6" width={24} height={24} />
            </a>
          )}
        </div>
      </div>

      {settings.infoAboutText && (
        <div>
          <h2 className="font-medium mb-2">О приложении</h2>
          <div className="text-sm opacity-80">{settings.infoAboutText}</div>
        </div>
      )}
      <div className="text-sm opacity-60">Работает на Rest Digital</div>
    </div>
  );
}
