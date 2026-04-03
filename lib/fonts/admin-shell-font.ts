import { Inter } from "next/font/google";

/**
 * Типографика админок (превью скилла neumorphism): геометрический sans, как Inter / Roboto.
 */
export const adminShellSans = Inter({
  variable: "--font-admin-neu",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});
