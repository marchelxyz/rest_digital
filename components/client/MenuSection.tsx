"use client";

import { useCartStore } from "./cart-store";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
};

type Category = {
  id: string;
  name: string;
  imageUrl?: string | null;
  products: Product[];
};

export function MenuSection({
  category,
  primaryColor,
  borderRadius,
  layout = "grid",
}: {
  category: Category;
  primaryColor: string;
  borderRadius: number;
  layout?: "grid" | "list" | "carousel";
}) {
  const { addItem } = useCartStore();

  const isGrid = layout === "grid";
  return (
    <section className="py-4">
      <h2 className="text-lg font-semibold mb-3">{category.name}</h2>
      <div className={isGrid ? "grid grid-cols-2 gap-3" : "space-y-3"}>
        {category.products.map((p) => (
          <div
            key={p.id}
            className={isGrid ? "flex flex-col" : "flex gap-3 p-3 rounded-xl border border-white/10 items-start"}
          >
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.name}
                className={isGrid ? "w-full aspect-square rounded-full object-cover" : "w-20 h-20 rounded-lg object-cover flex-shrink-0"}
              />
            ) : (
              <div className={isGrid ? "w-full aspect-square rounded-full bg-white/10" : "w-20 h-20 rounded-lg bg-white/10 flex-shrink-0"} />
            )}
            <div className={isGrid ? "mt-2" : "flex-1 min-w-0"}>
              <div className="font-medium text-sm">{p.name}</div>
              {p.description && (
                <p className={`text-xs opacity-80 ${isGrid ? "line-clamp-2" : "truncate"}`}>{p.description}</p>
              )}
              <div className={`flex items-center justify-between ${isGrid ? "mt-1" : "mt-1"}`}>
                <span className="text-sm">{p.price} ₽</span>
                <button
                  type="button"
                  onClick={() => addItem(p.id, p.name, p.price)}
                  className="px-3 py-1 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: primaryColor, borderRadius }}
                >
                  {isGrid ? "+" : "В корзину"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
