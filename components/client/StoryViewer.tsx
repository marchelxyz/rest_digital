"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Share2 } from "lucide-react";
import { useMiniApp } from "./MiniAppProvider";
import type { Story } from "./ClientApp";

type StoryViewerProps = {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  primaryColor?: string;
  appName?: string;
};

/**
 * Просмотр историй.
 * PC: модалка с градиентом, скруглёнными углами, иконками X и Share.
 * Mobile: полноэкранный.
 */
export function StoryViewer({ stories, initialIndex, onClose, primaryColor, appName = "Меню" }: StoryViewerProps) {
  const { share, haptic } = useMiniApp();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDesktop, setIsDesktop] = useState(false);
  const story = stories[currentIndex];

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      onClose();
    }
  }, [currentIndex, onClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  if (!story) return null;

  async function handleShare() {
    haptic.impact("light");
    const text = `${story!.title} — ${appName}`;
    const link = typeof window !== "undefined" ? window.location.href : "";
    const mediaUrl = story!.mediaType === "image" ? story!.mediaUrl : story!.coverUrl ?? story!.mediaUrl;
    await share(text, link, mediaUrl);
  }

  const content = (
    <div
      className="relative w-full bg-black flex items-center justify-center overflow-hidden"
      style={{ aspectRatio: "9/16", maxHeight: isDesktop ? "min(80vh, 560px)" : "100vh" }}
    >
      {story.mediaType === "video" ? (
        <video
          key={story.id}
          src={story.mediaUrl}
          className="w-full h-full object-contain"
          autoPlay
          muted
          playsInline
          loop={false}
          onEnded={goNext}
          controls
        />
      ) : (
        <img
          key={story.id}
          src={story.mediaUrl}
          alt={story.title}
          className="w-full h-full object-contain"
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="text-white font-medium">{story.title}</div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
        style={{ touchAction: "none" }}
        onClick={onClose}
      >
        <div
          className="relative rounded-2xl shadow-2xl overflow-hidden max-w-[420px] w-full"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #f0fdf4 50%, #fefce8 100%)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-gray-700 hover:bg-white transition-transform duration-200 active:scale-95"
              aria-label="Поделиться"
            >
              <Share2 size={18} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-gray-700 hover:bg-white"
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>
          </div>

          <div
            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
            onClick={goPrev}
            aria-hidden
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
            onClick={goNext}
            aria-hidden
          />

          <div className="p-4 pt-14">{content}</div>

          <div className="absolute top-4 left-4 right-20 flex gap-1">
            {stories.map((_, i) => (
              <div
                key={i}
                className="h-0.5 flex-1 rounded-full bg-white/40 overflow-hidden"
              >
                <div
                  className="h-full bg-white/90 transition-all duration-300"
                  style={{
                    width: i < currentIndex ? "100%" : i === currentIndex ? "100%" : "0%",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
      style={{ touchAction: "none" }}
    >
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white transition-transform duration-200 active:scale-95"
          aria-label="Поделиться"
        >
          <Share2 size={20} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white transition-transform duration-200 active:scale-95"
          aria-label="Закрыть"
        >
          <X size={24} />
        </button>
      </div>

      <div
        className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
        onClick={goPrev}
        aria-hidden
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
        onClick={goNext}
        aria-hidden
      />

      <div className="flex-1 w-full max-w-[420px] flex items-center justify-center">
        {content}
      </div>

      <div className="absolute top-4 left-4 right-14 flex gap-1">
        {stories.map((_, i) => (
          <div key={i} className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{
                width: i < currentIndex ? "100%" : i === currentIndex ? "100%" : "0%",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
