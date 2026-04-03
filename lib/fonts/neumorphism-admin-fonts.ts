import { JetBrains_Mono } from "next/font/google";

/**
 * Типографика skill neumorphism (mono для админ-панелей).
 */
export const neuAdminMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-neu-mono",
});
