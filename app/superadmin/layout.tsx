import { getSuperadmin } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSuperadmin();

  return (
    <div className="min-h-screen bg-background">
      {admin && admin.type === "superadmin" && (
        <header className="border-b px-4 py-3 flex items-center justify-between">
          <Link href="/superadmin" className="font-semibold">
            Rest Digital · Superadmin
          </Link>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">{admin.email}</span>
            <LogoutButton type="superadmin" />
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
