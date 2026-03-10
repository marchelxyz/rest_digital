"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton({ type = "superadmin" }: { type?: "superadmin" | "restaurant" }) {
  const router = useRouter();
  const path = type === "superadmin" ? "/api/superadmin/logout" : "/api/restaurant/logout";

  async function handleLogout() {
    await fetch(path, { method: "POST" });
    router.push(type === "superadmin" ? "/superadmin/login" : "/restaurant/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
      Выйти
    </Button>
  );
}
