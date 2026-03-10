"use client";

import { useState } from "react";
import { StoryViewer } from "./StoryViewer";
import type { Story } from "./ClientApp";

type StoriesStripProps = {
  stories: Story[];
  primaryColor: string;
  borderRadius: number;
};

export function StoriesStrip({ stories, primaryColor, borderRadius }: StoriesStripProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!stories.length) return null;

  const cardSize = 100;
  const frameWidth = 4;

  return (
    <>
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-3">
          {stories.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setViewerIndex(i)}
              className="shrink-0 flex flex-col items-center"
            >
              <div
                className="rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                  width: cardSize + frameWidth * 2,
                  height: (cardSize * 16) / 9 + frameWidth * 2,
                  padding: frameWidth,
                  backgroundColor: primaryColor,
                  borderRadius: borderRadius + 4,
                }}
              >
                <div
                  className="rounded-lg overflow-hidden w-full h-full"
                  style={{ borderRadius }}
                >
                  {s.mediaType === "video" ? (
                    <video src={s.mediaUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <img src={s.mediaUrl} alt={s.title} className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
              <span className="text-xs mt-1 truncate max-w-[110px] text-center">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {viewerIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
