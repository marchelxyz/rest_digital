"use client";

import { useState } from "react";

type EmojiCategory = {
  name: string;
  emojis: string[];
};

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: "Смайлы",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍",
      "🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢",
      "🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌",
      "😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠",
      "🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","😮","😯","😲","😳","🥺","🥹",
      "😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱",
    ],
  },
  {
    name: "Жесты",
    emojis: [
      "👋","🤚","🖐","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰",
      "🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛",
      "🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","💪","🦾","🦿","🦵","🦶","👂","🦻",
    ],
  },
  {
    name: "Сердца",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞",
      "💓","💗","💖","💘","💝","💟","♥️","🫶","😍","🥰","😘","💋","💑","👩‍❤️‍👨",
    ],
  },
  {
    name: "Еда",
    emojis: [
      "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍",
      "🥥","🥝","🍅","🍆","🥑","🥦","🫑","🌶","🫒","🧄","🧅","🥔","🍠","🥐","🍞",
      "🥖","🫓","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🍔","🍟","🍕","🌭","🥪",
      "🌮","🌯","🫔","🥙","🧆","🥗","🍿","🍱","🍣","🍤","🍙","🍚","🍘","🍛","🍜",
      "🍝","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍩",
      "🍪","☕","🍵","🫖","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🫗","🥃","🍸",
    ],
  },
  {
    name: "Объекты",
    emojis: [
      "🎁","🎉","🎊","🏆","🥇","🥈","🥉","⚽","🏀","🎯","🎮","🎲","🔔","📢","📣",
      "💰","💳","📱","💻","⌚","📷","🎬","🎤","🎵","🎶","📩","📨","📧","💌","📝",
      "📌","📎","🔑","🔒","🔓","🛒","🏷","🎫","🧾","💡","🔥","⭐","🌟","✨","💫",
      "🎈","🎀","🧧","📦","🪄","🫧","💎","🪙","📊","📈","📉",
    ],
  },
  {
    name: "Символы",
    emojis: [
      "✅","❌","⭕","❗","❓","‼️","⁉️","💯","🔴","🟠","🟡","🟢","🔵","🟣","⚫",
      "⚪","🟤","🔺","🔻","🔶","🔷","🔸","🔹","▪️","▫️","◾","◽","♻️","✳️","❇️",
      "🈶","🈚","🈸","🈺","🉐","🈴","🈵","🈹","🈲","🏧","⬆️","⬇️","⬅️","➡️","↩️",
    ],
  },
];

/**
 * Панель выбора эмодзи с категориями (стандартный Unicode-набор).
 */
export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="w-[320px] bg-white border rounded-lg shadow-xl overflow-hidden">
      <div className="flex border-b overflow-x-auto scrollbar-none">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            className={`px-3 py-2 text-xs whitespace-nowrap transition-colors ${
              i === activeCategory
                ? "border-b-2 border-[var(--admin-yellow)] text-[var(--admin-yellow-dark)] font-medium"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-[220px] overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-100 text-xl transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
