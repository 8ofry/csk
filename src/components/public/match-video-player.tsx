"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MatchVideoPlayer({ videoUrl, opponentName }: { videoUrl: string; opponentName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to extract YouTube/Vimeo embed URLs
  const getEmbedUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
        let videoId = "";
        if (parsed.hostname.includes("youtu.be")) {
          videoId = parsed.pathname.slice(1);
        } else {
          videoId = parsed.searchParams.get("v") || "";
        }
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (parsed.hostname.includes("vimeo.com")) {
        const videoId = parsed.pathname.split("/").pop();
        return `https://player.vimeo.com/video/${videoId}`;
      }
      return url; // fallback
    } catch {
      return url;
    }
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isEmbeddable = embedUrl.startsWith("https://www.youtube.com") || embedUrl.startsWith("https://player.vimeo.com");

  return (
    <>
      <Button
        variant="link"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-csk-gold hover:text-csk-goldLight p-0 h-auto underline font-medium"
      >
        Watch Bout
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-csk-gold/20 p-6 rounded-lg max-w-3xl w-full space-y-4 relative text-white shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-white text-lg font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-csk-gold">
              Match Video vs {opponentName}
            </h3>
            <div className="relative aspect-video w-full rounded bg-black overflow-hidden border border-neutral-800">
              {isEmbeddable ? (
                <iframe
                  src={embedUrl}
                  title={`Match vs ${opponentName}`}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <video src={videoUrl} controls className="absolute inset-0 w-full h-full" />
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
