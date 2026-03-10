import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-bold">Rest Digital</h1>
      <p className="text-muted-foreground text-center">
        SaaS для заведений общепита
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/superadmin/login">
          <Button>Superadmin</Button>
        </Link>
        <Link href="/restaurant/login">
          <Button variant="outline">Кабинет ресторана</Button>
        </Link>
        <Link href="/c/demo">
          <Button variant="secondary">Клиентское приложение (demo)</Button>
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        Для демо: создайте tenant в Superadmin, добавьте товары в кабинете ресторана
      </p>
    </div>
  );
}
