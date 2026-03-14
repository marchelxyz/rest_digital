"use client";

import { useState } from "react";
import { StoryViewer } from "./StoryViewer";
import type { Story } from "./ClientApp";

type StoriesStripProps = {
  stories: Story[];
  primaryColor: string;
  borderRadius: number;
  appName?: string;
};

/** Карточки историй 3:4, обложка — coverUrl (или mediaUrl для фото) */
function getCoverUrl(s: Story): string {
  if (s.coverUrl) return s.coverUrl;
  if (s.mediaType === "image") return s.mediaUrl;
  return s.mediaUrl;
}

export function StoriesStrip({ stories, primaryColor, borderRadius, appName }: StoriesStripProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!stories.length) return null;

  const cardWidth = 88;
  const aspectRatio = 3 / 4;
  const cardHeight = cardWidth / aspectRatio;
  const frameWidth = 4;

  return (
    <>
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-3">
          {stories.map((s, i) => {
            const coverUrl = getCoverUrl(s);
            const isVideoCover = !s.coverUrl && s.mediaType === "video";
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setViewerIndex(i)}
                className="shrink-0 flex flex-col items-center"
              >
                <div
                  className="rounded-xl overflow-hidden flex items-center justify-center"
                  style={{
                    width: cardWidth + frameWidth * 2,
                    height: cardHeight + frameWidth * 2,
                    padding: frameWidth,
                    backgroundColor: primaryColor,
                    borderRadius: borderRadius + 4,
                  }}
                >
                  <div
                    className="rounded-lg overflow-hidden w-full h-full"
                    style={{ borderRadius, aspectRatio: "3/4" }}
                  >
                    {isVideoCover ? (
                      <video
                        src={coverUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img src={coverUrl} alt={s.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                </div>
                <span className="text-xs mt-1 truncate max-w-[96px] text-center">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {viewerIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          primaryColor={primaryColor}
          appName={appName}
        />
      )}
    </>
  );
}
