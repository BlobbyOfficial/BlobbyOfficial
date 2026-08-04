"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Portfolio video player.
 *
 * The grid used to render bare `<video controls>`, which meant chunky native
 * browser chrome sitting inside a black tile, no way to stop fifteen clips
 * playing over each other, and a review overlay that appeared on hover —
 * directly on top of the controls you were reaching for.
 *
 * This is a small custom player instead: controls in the site's own visual
 * language, only ever one clip playing, playback paused when a clip scrolls
 * out of view, and the review shown while a clip is idle rather than
 * competing with it mid-playback.
 */

/** The clip currently playing, so starting one stops whichever was running. */
let activeVideo: HTMLVideoElement | null = null;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

const iconClass = "w-4 h-4 fill-current";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
      <path d="M4 9v6h4l5 5V4L8 9H4zm13.6 3l2.4-2.4-1.2-1.2L16.4 10.8 14 8.4l-1.2 1.2L15.2 12l-2.4 2.4 1.2 1.2 2.4-2.4 2.4 2.4 1.2-1.2L17.6 12z" />
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
      <path d="M4 9v6h4l5 5V4L8 9H4zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM13 2.2v2.1a7.5 7.5 0 0 1 0 15.4v2.1a9.5 9.5 0 0 0 0-19.6z" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} aria-hidden="true">
      <path d="M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z" />
    </svg>
  );
}

export function VideoPlayer({
  src,
  title,
  overlay,
  className = "",
}: {
  src: string;
  title: string;
  /** Review card, shown while the clip is idle. */
  overlay?: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [started, setStarted] = useState(false);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // Stop whatever else was going before this one starts.
      if (activeVideo && activeVideo !== video) activeVideo.pause();
      activeVideo = video;
      void video.play().catch(() => {
        // Autoplay policies can still refuse; leave the poster frame up.
      });
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) void document.exitFullscreen();
    else void container.requestFullscreen?.().catch(() => {});
  }, []);

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), video.duration);
  }, []);

  // Keep React state in step with the element, which can also be driven by
  // the OS media keys, Picture-in-Picture, or another player pausing this one.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setPlaying(true);
      setStarted(true);
      if (activeVideo && activeVideo !== video) activeVideo.pause();
      activeVideo = video;
    };
    const onPause = () => {
      setPlaying(false);
      if (activeVideo === video) activeVideo = null;
    };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => setDuration(video.duration);
    const onVolumeChange = () => setMuted(video.muted);
    const onEnded = () => {
      setPlaying(false);
      setStarted(false);
      video.currentTime = 0;
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("ended", onEnded);

    if (video.readyState >= 1) setDuration(video.duration);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("ended", onEnded);
      if (activeVideo === video) activeVideo = null;
    };
  }, []);

  // A clip scrolled well out of view shouldn't keep playing audio.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !video.paused) video.pause();
      },
      { threshold: 0.25 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    // Let the scrubber and buttons handle their own keys.
    if ((event.target as HTMLElement).closest("input, button")) return;

    switch (event.key) {
      case " ":
      case "k":
        event.preventDefault();
        togglePlay();
        break;
      case "m":
        event.preventDefault();
        toggleMute();
        break;
      case "f":
        event.preventDefault();
        toggleFullscreen();
        break;
      case "ArrowRight":
        event.preventDefault();
        seekBy(5);
        break;
      case "ArrowLeft":
        event.preventDefault();
        seekBy(-5);
        break;
      default:
        break;
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={title}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={`group/player relative bg-black overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-accent ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        title={title}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="absolute inset-0 w-full h-full object-contain bg-black cursor-pointer"
      />

      {/* Review card — visible while the clip is idle, out of the way once
          it's playing so it never covers the picture or the controls. */}
      {overlay && !started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/85 px-5 text-center opacity-0 pointer-events-none transition-opacity duration-250 group-hover/player:opacity-100">
          {overlay}
        </div>
      )}

      {/* Centre play affordance, hidden once playback starts. */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={`Play ${title}`}
          className="absolute inset-0 z-[2] flex items-center justify-center cursor-pointer"
        >
          <span className="flex items-center justify-center w-14 h-14 border border-white/30 bg-black/40 backdrop-blur-sm text-fg transition-colors hover:border-white/70 hover:bg-black/60 max-md:w-11 max-md:h-11">
            <span className="ml-0.5">
              <PlayIcon />
            </span>
          </span>
        </button>
      )}

      {/* Control bar — always available to keyboard users, revealed on hover
          for everyone else so it doesn't sit over the artwork permanently. */}
      <div
        className="absolute inset-x-0 bottom-0 z-[3] flex items-center gap-3 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2.5 pt-6 opacity-0 transition-opacity duration-200 group-hover/player:opacity-100 group-focus-within/player:opacity-100 max-md:opacity-100"
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? `Pause ${title}` : `Play ${title}`}
          className="text-mid transition-colors hover:text-fg shrink-0 cursor-pointer"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(event) => {
            const video = videoRef.current;
            if (!video) return;
            video.currentTime = Number(event.target.value);
            setCurrentTime(Number(event.target.value));
          }}
          aria-label={`Seek ${title}`}
          className="video-scrubber flex-1 min-w-0 cursor-pointer"
          style={{ "--progress": `${progress}%` } as React.CSSProperties}
        />

        <span className="font-mono text-[9px] tracking-[0.08em] text-mid tabular-nums shrink-0 max-[380px]:hidden">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? `Unmute ${title}` : `Mute ${title}`}
          className="text-mid transition-colors hover:text-fg shrink-0 cursor-pointer"
        >
          {muted ? <MutedIcon /> : <SoundIcon />}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={`Fullscreen ${title}`}
          className="text-mid transition-colors hover:text-fg shrink-0 cursor-pointer max-md:hidden"
        >
          <FullscreenIcon />
        </button>
      </div>
    </div>
  );
}
