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
    autoPlayDelay = 0,
    onEnded,
    onPlay,
    onPause,
    className = "",
    questionAudioText,
  } = props;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showAudioTranscript, setShowAudioTranscript] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  React.useImperativeHandle(ref, () => ({
    pause() {
      audioRef.current?.pause();
      setIsPlaying(false);
    },
    play() {
      audioRef.current?.play();
      setIsPlaying(true);
    },
    stop() {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    },
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const loaded = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      if (autoPlay && !hasStarted) {
        setHasStarted(true);
        setTimeout(() => handlePlay(), autoPlayDelay);
      }
    };

    audio.addEventListener("loadedmetadata", loaded);
    audio.addEventListener("timeupdate", () =>
      setCurrentTime(audio.currentTime),
    );
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    });
    audio.addEventListener("error", () => setError("Failed to load audio"));

    return () => audio.removeEventListener("loadedmetadata", loaded);
  }, [src, autoPlay, autoPlayDelay, hasStarted]);

  const formatTime = (t: number) =>
    `${Math.floor(t / 60)}:${Math.floor(t % 60)
      .toString()
      .padStart(2, "0")}`;

  const handlePlay = async () => {
    try {
      await audioRef.current?.play();
      setIsPlaying(true);
      onPlay?.();
    } catch {
      setError("Failed to play audio");
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
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

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
