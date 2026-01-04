import {
  AlertCircle,
  Loader,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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
  questionId: string;
  questionAudioText: string;
}

const AudioPlayer = React.forwardRef<
  { pause: () => void; play: () => void; stop: () => void },
  AudioPlayerProps
>(
  (
    {
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
      questionId = '',
      questionAudioText = '',
    },
    ref
  ) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasStarted, setHasStarted] = useState(false);

    const [showAudioTranscript, setShowAudioTranscript] = useState(false);
    // Transcript read more/less state
    const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(
      new Set()
    );
    const audioRef = useRef<HTMLAudioElement>(null);

    // Expose stop, pause, and play methods through ref
    React.useImperativeHandle(ref, () => ({
      pause: () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      },
      play: () => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      },
      stop: () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
          setCurrentTime(0);
        }
      },
    }));

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

    const MAX_CHARS = 300;
    const isExpanded = expandedTranscripts.has(questionId);
    const needsReadMore = questionAudioText.length > MAX_CHARS;
    const displayText = isExpanded
      ? questionAudioText
      : questionAudioText.substring(0, MAX_CHARS);

    const toggleExpanded = () => {
      const newExpanded = new Set(expandedTranscripts);
      if (newExpanded.has(questionId)) {
        newExpanded.delete(questionId);
      } else {
        newExpanded.add(questionId);
      }
      setExpandedTranscripts(newExpanded);
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

                <div className='flex gap-10'>
                  <button
                    onClick={() => setShowAudioTranscript(true)}
                    className='flex items-center justify-center px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl'
                  >
                    <p className='text-sm'>See Audio Transcript</p>
                  </button>
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
              </div>
            )}

            {showAudioTranscript && questionAudioText && (
              <div className='fixed inset-0 z-50 overflow-y-auto'>
                <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                  {/* Background overlay */}
                  <div
                    className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75'
                    onClick={() => setShowAudioTranscript(false)}
                  ></div>

                  {/* Modal */}
                  <div className='inline-block w-full max-w-5xl  p-0 my-8  overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-lg border border-gray-200 dark:border-gray-700'>
                    {/* Header */}
                    <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 dark:bg-gray-750'>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          Audio Transcription
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowAudioTranscript(false)}
                        className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700'
                      >
                        <X className='h-5 w-5' />
                      </button>
                    </div>

                    <div className='p-6'>
                      {/* Content */}
                      <div className='space-y-6 overflow-y-auto max-h-[90%]'>
                        <p className='text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap'>
                          {displayText}
                          {needsReadMore && !isExpanded && '...'}
                        </p>
                        {needsReadMore && (
                          <button
                            onClick={toggleExpanded}
                            className='mt-2 text-blue-600 dark:text-blue-400 font-medium text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors'
                          >
                            {isExpanded ? 'Read Less' : 'Read More'}
                          </button>
                        )}
                      </div>

                      {/* Footer */}
                      <div className='flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
                        <button
                          onClick={() => setShowAudioTranscript(false)}
                          className='px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium'
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
