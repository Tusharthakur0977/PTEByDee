import {
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
  title?: string;
  autoPlay?: boolean;
  autoPlayDelay?: number;
  showControls?: boolean;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
  compact?: boolean;
  questionId: string;
  questionAudioText?: string;
}

const AudioPlayer = React.forwardRef<
  { pause: () => void; play: () => void; stop: () => void },
  AudioPlayerProps
>((props, ref) => {
  const {
    src,
    autoPlay = false,
    autoPlayDelay: autoPlayDelayProp,
    onEnded,
    onPlay,
    onPause,
    className = "",
    questionAudioText,
  } = props;

  const effectiveAutoPlayDelay = autoPlayDelayProp ?? (autoPlay ? 2000 : 0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAudioTranscript, setShowAudioTranscript] = useState(false);
  const [pendingAutoPlay, setPendingAutoPlay] = useState(false);
  const [autoPlayDelayLeftMs, setAutoPlayDelayLeftMs] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const autoPlayTimeoutRef = useRef<number | null>(null);
  const autoPlayIntervalRef = useRef<number | null>(null);
  const hasScheduledAutoPlayRef = useRef(false);

  const clearAutoPlayTimers = () => {
    if (autoPlayTimeoutRef.current) {
      window.clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
    if (autoPlayIntervalRef.current) {
      window.clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
    setAutoPlayDelayLeftMs(0);
  };

  const formatPlaybackError = (playbackError: unknown) => {
    if (
      playbackError &&
      typeof playbackError === "object" &&
      "name" in playbackError
    ) {
      const errorName = String(playbackError.name);

      if (errorName === "NotAllowedError" || errorName === "AbortError") {
        return null;
      }
    }

    return "Failed to play audio";
  };

  React.useImperativeHandle(ref, () => ({
    pause() {
      clearAutoPlayTimers();
      setPendingAutoPlay(false);
      audioRef.current?.pause();
      setIsPlaying(false);
    },
    play() {
      clearAutoPlayTimers();
      setPendingAutoPlay(false);
      audioRef.current?.play();
      setIsPlaying(true);
    },
    stop() {
      if (!audioRef.current) return;
      clearAutoPlayTimers();
      setPendingAutoPlay(false);
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    },
  }));

  useEffect(() => {
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setPendingAutoPlay(false);
    clearAutoPlayTimers();
    hasScheduledAutoPlayRef.current = false;

    // Ensure the previous question's audio is fully stopped/reset when the
    // question changes (sidebar navigation, next/prev, etc.).
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      // Force the element to load the latest `src` value immediately.
      audio.load();
    }
  }, [src, props.questionId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const loaded = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      if (autoPlay && !hasScheduledAutoPlayRef.current) {
        hasScheduledAutoPlayRef.current = true;
        clearAutoPlayTimers();

        const delayMs = Math.max(0, effectiveAutoPlayDelay);
        if (delayMs > 0) {
          const startAt = Date.now();
          // On hard refresh, browsers often block autoplay until a user gesture.
          // In that case, a countdown UI is misleading, so we hide it.
          const hasUserGesture =
            typeof navigator !== "undefined"
              ? (navigator as any).userActivation?.hasBeenActive ?? true
              : true;

          if (hasUserGesture) {
            setAutoPlayDelayLeftMs(delayMs);
            autoPlayIntervalRef.current = window.setInterval(() => {
              const elapsed = Date.now() - startAt;
              const remaining = Math.max(0, delayMs - elapsed);
              setAutoPlayDelayLeftMs(remaining);
              if (remaining <= 0 && autoPlayIntervalRef.current) {
                window.clearInterval(autoPlayIntervalRef.current);
                autoPlayIntervalRef.current = null;
              }
            }, 100);
          }
        }

        autoPlayTimeoutRef.current = window.setTimeout(() => {
          clearAutoPlayTimers();
          void handlePlay(true);
        }, delayMs);
      }
    };

    const timeUpdated = () => setCurrentTime(audio.currentTime);
    const ended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const failed = () => {
      setIsLoading(false);
      setError("Failed to load audio");
    };

    audio.addEventListener("loadedmetadata", loaded);
    audio.addEventListener("timeupdate", timeUpdated);
    audio.addEventListener("ended", ended);
    audio.addEventListener("error", failed);

    return () => {
      clearAutoPlayTimers();
      audio.removeEventListener("loadedmetadata", loaded);
      audio.removeEventListener("timeupdate", timeUpdated);
      audio.removeEventListener("ended", ended);
      audio.removeEventListener("error", failed);
    };
  }, [src, autoPlay, effectiveAutoPlayDelay]);

  useEffect(() => {
    if (!pendingAutoPlay) return;

    const resumePendingAutoPlay = () => {
      setPendingAutoPlay(false);
      void handlePlay();
    };

    window.addEventListener("pointerdown", resumePendingAutoPlay, {
      once: true,
    });
    window.addEventListener("keydown", resumePendingAutoPlay, { once: true });
    window.addEventListener("touchstart", resumePendingAutoPlay, {
      once: true,
    });

    return () => {
      window.removeEventListener("pointerdown", resumePendingAutoPlay);
      window.removeEventListener("keydown", resumePendingAutoPlay);
      window.removeEventListener("touchstart", resumePendingAutoPlay);
    };
  }, [pendingAutoPlay]);

  const formatTime = (t: number) =>
    `${Math.floor(t / 60)}:${Math.floor(t % 60)
      .toString()
      .padStart(2, "0")}`;

  const handlePlay = async (isAutoPlayAttempt = false) => {
    try {
      setError(null);
      await audioRef.current?.play();
      setIsPlaying(true);
      clearAutoPlayTimers();
      onPlay?.();
    } catch (playbackError) {
      setIsPlaying(false);

      const playbackMessage = formatPlaybackError(playbackError);

      if (isAutoPlayAttempt && playbackMessage === null) {
        setPendingAutoPlay(true);
        return;
      }

      if (!isAutoPlayAttempt && playbackMessage) {
        setError(playbackMessage);
      }
    }
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    onPause?.();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Number(e.target.value);
    setCurrentTime(Number(e.target.value));
  };

  const handleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? volume : 0;
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 text-red-600 bg-red-50 rounded-md">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div
        className={`flex items-center gap-3 w-full px-4 py-3
        bg-white dark:bg-gray-800
        rounded-lg ${className}`}
      >
        {/* Play */}
        <div className="relative flex items-center">
          <button
            onClick={() => {
              clearAutoPlayTimers();
              setPendingAutoPlay(false);

              if (isPlaying) {
                handlePause();
                return;
              }

              void handlePlay();
            }}
            className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center"
            aria-label={
              pendingAutoPlay
                ? "Audio is ready. Press play to start listening."
                : "Play audio"
            }
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          {pendingAutoPlay && !isPlaying && (
            <div className="absolute left-12 top-1/2 z-10 w-64 -translate-y-1/2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-900 shadow-sm dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
              Tap play to start the audio. Your browser needs a quick click after refresh.
            </div>
          )}

          {!pendingAutoPlay && !isPlaying && autoPlayDelayLeftMs > 0 && (
            <div className="absolute left-1/2 -top-2 z-10 -translate-x-1/2 -translate-y-full">
              <div className="relative overflow-hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-lg shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:shadow-black/30">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Starting in{" "}
                    <span className="tabular-nums">
                      {Math.ceil(autoPlayDelayLeftMs / 1000)}
                    </span>
                    s
                  </span>
                </div>

                <div className="mt-1 h-0.5 w-full rounded bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-0.5 rounded bg-gradient-to-r from-emerald-400 to-blue-500 transition-[width] duration-100 ease-linear"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          (1 -
                            autoPlayDelayLeftMs /
                              Math.max(1, effectiveAutoPlayDelay)) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </div>

                <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-white drop-shadow-sm dark:border-t-slate-900" />
              </div>
            </div>
          )}
        </div>

        {/* Restart */}
        <button
          onClick={handleRestart}
          className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Progress */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
        />

        {/* Time */}
        <span className="text-xs text-gray-500 w-14 text-right">
          {formatTime(currentTime)}
        </span>

        {/* Volume */}

        <div className="flex items-center space-x-3">
          <button
            onClick={handleMute}
            className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>{" "}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Transcript */}
        {questionAudioText && (
          <button
            onClick={() => setShowAudioTranscript(true)}
            className="text-xs font-medium text-blue-600"
          >
            Transcript
          </button>
        )}
      </div>

      {/* Transcript Modal (unchanged logic) */}
      {showAudioTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[80vh]flex flex-col ">
            <div className="flex justify-between mb-4 p-6 border-b">
              <h3 className="font-semibold">Audio Transcript</h3>
              <button onClick={() => setShowAudioTranscript(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm  whitespace-pre-wrap px-5 pt-2 pb-5">
              {questionAudioText}
            </p>
          </div>
        </div>
      )}
    </>
  );
});

AudioPlayer.displayName = "AudioPlayer";

export default AudioPlayer;
