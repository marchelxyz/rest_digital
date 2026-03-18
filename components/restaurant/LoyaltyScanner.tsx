"use client";

import dynamic from "next/dynamic";

const LoyaltyScannerClient = dynamic(
  () => import("./LoyaltyScannerClient").then((m) => m.LoyaltyScannerClient),
  { ssr: false, loading: () => <div className="text-sm text-neutral-500">Загрузка сканера...</div> }
);

export function LoyaltyScanner() {
  return <LoyaltyScannerClient />;
}

