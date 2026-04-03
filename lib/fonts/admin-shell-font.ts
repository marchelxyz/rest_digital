import { Geist } from "next/font/google";

/**
 * Типографика админок (superadmin / партнёрский кабинет) — тот же Geist Sans, что и в корне приложения.
 */
export const adminShellSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});
