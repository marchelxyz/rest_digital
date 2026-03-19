"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  Smile,
  X,
} from "lucide-react";
import { EmojiPicker } from "@/components/restaurant/mailings/EmojiPicker";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

type FormatCommand = "bold" | "italic" | "underline" | "strikeThrough";

const FORMAT_BUTTONS: { command: FormatCommand; icon: typeof Bold; label: string }[] = [
  { command: "bold", icon: Bold, label: "Жирный" },
  { command: "italic", icon: Italic, label: "Курсив" },
  { command: "underline", icon: Underline, label: "Подчёркнутый" },
  { command: "strikeThrough", icon: Strikethrough, label: "Зачёркнутый" },
];

/**
 * Мини-WYSIWYG редактор текста рассылки.
 *
 * Поддерживает форматирование (жирный, курсив, подчёркивание, зачёркивание),
 * вставку гиперссылок и встроенный пикер эмодзи (стандартный пакет Android/iOS).
 *
 * При выделении текста над ним появляется плавающая панель форматирования.
 */
export function RichTextEditor({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [floatingToolbar, setFloatingToolbar] = useState<{ x: number; y: number } | null>(null);

  const execCommand = useCallback((cmd: FormatCommand) => {
    document.execCommand(cmd, false);
    _emitChange(editorRef, onChange);
  }, [onChange]);

  const insertLink = useCallback(() => {
    const url = prompt("Введите URL:");
    if (!url?.trim()) return;
    document.execCommand("createLink", false, url.trim());
    _emitChange(editorRef, onChange);
  }, [onChange]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      document.execCommand("insertText", false, emoji);
      _emitChange(editorRef, onChange);
      setShowEmoji(false);
    },
    [onChange]
  );

  useEffect(() => {
    function handleSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !editorRef.current) {
        setFloatingToolbar(null);
        return;
      }
      if (!editorRef.current.contains(sel.anchorNode)) {
        setFloatingToolbar(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      setFloatingToolbar({
        x: rect.left - editorRect.left + rect.width / 2,
        y: rect.top - editorRect.top - 8,
      });
    }
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  return (
    <div className="space-y-0 relative">
      <div className="flex items-center gap-1 border border-b-0 rounded-t-lg px-2 py-1.5 bg-neutral-50">
        {FORMAT_BUTTONS.map(({ command, icon: Icon, label }) => (
          <button
            key={command}
            onClick={() => execCommand(command)}
            title={label}
            className="p-1.5 rounded hover:bg-neutral-200 transition-colors text-neutral-600"
          >
            <Icon size={16} />
          </button>
        ))}
        <span className="w-px h-5 bg-neutral-300 mx-1" />
        <button
          onClick={insertLink}
          title="Гиперссылка"
          className="p-1.5 rounded hover:bg-neutral-200 transition-colors text-neutral-600"
        >
          <LinkIcon size={16} />
        </button>
        <span className="w-px h-5 bg-neutral-300 mx-1" />
        <button
          onClick={() => setShowEmoji((prev) => !prev)}
          title="Эмодзи"
          className={`p-1.5 rounded transition-colors ${
            showEmoji ? "bg-neutral-200 text-neutral-900" : "hover:bg-neutral-200 text-neutral-600"
          }`}
        >
          <Smile size={16} />
        </button>
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="border rounded-b-lg px-4 py-3 min-h-[160px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-yellow)]/40 prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: value }}
          onInput={() => _emitChange(editorRef, onChange)}
        />

        {floatingToolbar && (
          <FloatingToolbar
            x={floatingToolbar.x}
            y={floatingToolbar.y}
            onFormat={execCommand}
            onLink={insertLink}
          />
        )}
      </div>

      {showEmoji && (
        <div className="absolute z-50 right-0 mt-1">
          <div className="relative">
            <button
              onClick={() => setShowEmoji(false)}
              className="absolute -top-2 -right-2 z-10 bg-white border rounded-full p-0.5 shadow hover:bg-neutral-100"
            >
              <X size={14} />
            </button>
            <EmojiPicker onSelect={insertEmoji} />
          </div>
        </div>
      )}
    </div>
  );
}

function FloatingToolbar({
  x,
  y,
  onFormat,
  onLink,
}: {
  x: number;
  y: number;
  onFormat: (cmd: FormatCommand) => void;
  onLink: () => void;
}) {
  return (
    <div
      className="absolute z-40 flex items-center gap-0.5 bg-[var(--admin-black)] text-white rounded-lg shadow-lg px-1 py-1 -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: y }}
    >
      {FORMAT_BUTTONS.map(({ command, icon: Icon, label }) => (
        <button
          key={command}
          onMouseDown={(e) => {
            e.preventDefault();
            onFormat(command);
          }}
          title={label}
          className="p-1.5 rounded hover:bg-white/20 transition-colors"
        >
          <Icon size={14} />
        </button>
      ))}
      <span className="w-px h-4 bg-neutral-500 mx-0.5" />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          onLink();
        }}
        title="Гиперссылка"
        className="p-1.5 rounded hover:bg-white/20 transition-colors"
      >
        <LinkIcon size={14} />
      </button>
    </div>
  );
}

function _emitChange(
  ref: React.RefObject<HTMLDivElement | null>,
  onChange: (html: string) => void
) {
  if (ref.current) {
    onChange(ref.current.innerHTML);
  }
}
