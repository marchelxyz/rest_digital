"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import type { Story } from "./ClientApp";

type StoryViewerProps = {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
};

/**
 * Полноэкранный просмотр историй в формате Instagram Stories.
 * Поддержка фото и видео.
 */
export function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const story = stories[currentIndex];

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

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      style={{ touchAction: "none" }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
        aria-label="Закрыть"
      >
        <X size={24} />
      </button>

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

      <div
        className="relative w-full max-w-[420px] aspect-[9/16] max-h-[100vh] bg-black"
        style={{ aspectRatio: "9/16" }}
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

      <div className="absolute top-4 left-4 right-14 flex gap-1">
        {stories.map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden"
          >
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
