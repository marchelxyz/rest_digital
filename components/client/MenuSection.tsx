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
}: {
  category: Category;
  primaryColor: string;
  borderRadius: number;
}) {
  const { addItem } = useCartStore();

  return (
    <section className="py-4">
      <h2 className="text-lg font-semibold mb-3">{category.name}</h2>
      <div className="space-y-3">
        {category.products.map((p) => (
          <div
            key={p.id}
            className="flex gap-3 p-3 rounded-xl border border-white/10"
          >
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-white/10 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium">{p.name}</div>
              {p.description && (
                <p className="text-sm opacity-80 truncate">{p.description}</p>
              )}
              <div className="flex items-center justify-between mt-1">
                <span>{p.price} ₽</span>
                <button
                  type="button"
                  onClick={() => addItem(p.id, p.name, p.price)}
                  className="px-3 py-1 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: primaryColor, borderRadius }}
                >
                  В корзину
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
