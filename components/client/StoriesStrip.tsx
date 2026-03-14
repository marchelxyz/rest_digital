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

  const cardWidth = 136;
  const gap = 10;
  const aspectRatio = 3 / 4;
  const cardHeight = cardWidth / aspectRatio;

  return (
    <>
      <div className="px-4 py-3 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-[10px]" style={{ gap }}>
          {stories.map((s, i) => {
            const coverUrl = getCoverUrl(s);
            const isVideoCover = !s.coverUrl && s.mediaType === "video";
            const hasLink = !!(s.linkUrl && s.linkUrl.trim());
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (hasLink) {
                    const url = s.linkUrl!;
                    window.open(url, "_blank");
                  } else {
                    setViewerIndex(i);
                  }
                }}
                className="shrink-0 flex flex-col items-center"
              >
                <div
                  className="rounded-xl overflow-hidden flex items-center justify-center"
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    borderRadius: borderRadius + 4,
                  }}
                >
                  <div
                    className="rounded-xl overflow-hidden w-full h-full"
                    style={{ borderRadius: borderRadius + 4, aspectRatio: "3/4" }}
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
