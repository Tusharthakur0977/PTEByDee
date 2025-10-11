import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Loader,
  AlertCircle,
} from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  autoPlay?: boolean;
  autoPlayDelay?: number; // Delay in milliseconds before auto-playing
  showControls?: boolean;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
  compact?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  autoPlay = false,
  autoPlayDelay = 0,
  showControls = true,
  onEnded,
  onPlay,
  onPause,
  className = '',
  compact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      if (autoPlay && !hasStarted) {
        setHasStarted(true);
        if (autoPlayDelay > 0) {
          setTimeout(() => {
            handlePlay();
          }, autoPlayDelay);
        } else {
          handlePlay();
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setError(null);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [src, autoPlay, onEnded, hasStarted]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setIsPlaying(true);
      onPlay?.();
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play audio. Please try again.');
    }
  };

  const handlePause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    onPause?.();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    if (isPlaying) {
      handlePlay();
    }
  };

  if (error) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
      >
        <div className='flex items-center space-x-2 text-red-600 dark:text-red-400'>
          <AlertCircle className='h-5 w-5' />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm ${className}`}
      >
        <audio
          ref={audioRef}
          src={src}
          preload='metadata'
        />

        {title && (
          <div className='mb-3'>
            <h4 className='font-medium text-gray-900 dark:text-white text-sm'>
              {title}
            </h4>
          </div>
        )}

        {isLoading ? (
          <div className='flex items-center justify-center py-2'>
            <Loader className='h-4 w-4 animate-spin text-blue-600 mr-2' />
            <span className='text-sm text-gray-600 dark:text-gray-300'>
              Loading audio...
            </span>
          </div>
        ) : (
          <div className='flex items-center space-x-3'>
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className='flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-200'
            >
              {isPlaying ? (
                <Pause className='h-4 w-4' />
              ) : (
                <Play className='h-4 w-4 ml-0.5' />
              )}
            </button>

            <div className='flex-1'>
              <input
                type='range'
                min='0'
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className='w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider'
              />
              <div className='flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1'>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload='metadata'
      />

      {title && (
        <div className='mb-4'>
          <h4 className='font-semibold text-lg text-gray-900 dark:text-white'>
            {title}
          </h4>
        </div>
      )}

      {isLoading ? (
        <div className='flex items-center justify-center py-4'>
          <Loader className='h-6 w-6 animate-spin text-blue-600 mr-3' />
          <span className='text-gray-600 dark:text-gray-300 font-medium'>
            Loading audio...
          </span>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className='mb-6'>
            <input
              type='range'
              min='0'
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className='w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider'
            />
            <div className='flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400 mt-2'>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {showControls && (
            <div className='flex items-center justify-between'>
              {/* Playback Controls */}
              <div className='flex items-center space-x-2'>
                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className='flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl'
                >
                  {isPlaying ? (
                    <Pause className='h-5 w-5' />
                  ) : (
                    <Play className='h-5 w-5 ml-0.5' />
                  )}
                </button>

                <button
                  onClick={handleRestart}
                  className='flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200'
                >
                  <RotateCcw className='h-5 w-5' />
                </button>
              </div>

              {/* Volume Controls */}
              <div className='flex items-center space-x-3'>
                <button
                  onClick={handleMute}
                  className='text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-all duration-200'
                >
                  {isMuted ? (
                    <VolumeX className='h-5 w-5' />
                  ) : (
                    <Volume2 className='h-5 w-5' />
                  )}
                </button>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.1'
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className='w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider'
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AudioPlayer;
