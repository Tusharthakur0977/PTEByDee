import React, { useState, useEffect } from 'react';
import { Play, Lock, Eye, Loader, Video } from 'lucide-react';
import { getSecureVideoUrl } from '../services/courses';

interface VideoPlayerProps {
  videoUrl?: string;
  videoKey?: string;
  courseId?: string;
  title: string;
  duration?: string;
  isPreview?: boolean;
  isEnrolled?: boolean;
  onPlay?: () => void;
  onProgress?: (watchedDuration: number) => void;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  videoKey,
  courseId,
  title,
  duration,
  isPreview = false,
  isEnrolled = false,
  onPlay,
  onProgress,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [secureVideoUrl, setSecureVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);

  const canPlay = isPreview || isEnrolled;

  useEffect(() => {
    if (videoKey && courseId && isEnrolled && !isPreview) {
      loadSecureVideoUrl();
    }
  }, [videoKey, courseId, isEnrolled, isPreview]);

  const loadSecureVideoUrl = async () => {
    if (!videoKey || !courseId) {
      return;
    }

    try {
      setIsLoadingVideo(true);
      setVideoError(null);
      const response = await getSecureVideoUrl(videoKey, courseId);
      setSecureVideoUrl(response.secureUrl);
    } catch (error: any) {
      console.error('Failed to load secure video URL:', error);
      setVideoError('Failed to load video. Please try again.');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const getVideoUrl = () => {
    if (isEnrolled && videoKey && secureVideoUrl) {
      return secureVideoUrl;
    }
    if (videoUrl) {
      return videoUrl;
    }
    return null;
  };

  const handlePlay = async () => {
    const currentVideoUrl = getVideoUrl();

    if (canPlay && currentVideoUrl) {
      setIsPlaying(true);
      onPlay?.();
    } else if (
      canPlay &&
      videoKey &&
      courseId &&
      isEnrolled &&
      !secureVideoUrl &&
      !isLoadingVideo
    ) {
      try {
        setIsLoadingVideo(true);
        const response = await getSecureVideoUrl(videoKey, courseId);
        setSecureVideoUrl(response.secureUrl);

        if (response.secureUrl) {
          setIsPlaying(true);
          onPlay?.();
        }
      } catch (error) {
        console.error('Error loading secure URL:', error);
        setVideoError('Failed to load video. Please try again.');
      } finally {
        setIsLoadingVideo(false);
      }
    }
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }

    return url;
  };

  const currentVideoUrl = getVideoUrl();

  if (isPlaying && currentVideoUrl && canPlay) {
    return (
      <div
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-800 ${className}`}
      >
        {currentVideoUrl.includes('youtube.com') ||
        currentVideoUrl.includes('youtu.be') ||
        currentVideoUrl.includes('vimeo.com') ? (
          <div className='relative w-full h-0 pb-[56.25%]'>
            <iframe
              src={getEmbedUrl(currentVideoUrl)}
              className='absolute left-0 top-0 h-full w-full'
              style={{ border: 0 }}
              allowFullScreen
              title={title}
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            />
          </div>
        ) : (
          <video
            src={currentVideoUrl}
            controls
            className='w-full h-auto bg-black'
            title={title}
            onTimeUpdate={(e) => {
              const video = e.target as HTMLVideoElement;
              const currentTime = Math.floor(video.currentTime);

              if (currentTime > 0 && currentTime - lastProgressUpdate >= 10) {
                setLastProgressUpdate(currentTime);
                onProgress?.(currentTime);
              }
            }}
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    );
  }

  if (isLoadingVideo && canPlay) {
    return (
      <div
        className={`flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 ${className}`}
      >
        <div className='text-center text-white'>
          <Loader className='mx-auto mb-3 h-8 w-8 animate-spin' />
          <p className='text-sm text-slate-300'>Loading video...</p>
        </div>
      </div>
    );
  }

  if (videoError && canPlay) {
    return (
      <div
        className={`flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 ${className}`}
      >
        <div className='text-center'>
          <p className='text-sm text-red-600 dark:text-red-300'>{videoError}</p>
          <button
            onClick={loadSecureVideoUrl}
            className='mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-sm dark:border-slate-800 ${className}`}
    >
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.28),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_30%)]' />

      <div className='relative flex min-h-[320px] flex-col items-center justify-center px-6 py-8 text-center text-white'>
        <div className='mb-5 inline-flex rounded-2xl bg-white/10 p-3 text-slate-200 backdrop-blur-sm'>
          <Video className='h-6 w-6' />
        </div>

        <button
          type='button'
          className={`mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${
            canPlay
              ? 'bg-white text-slate-900 shadow-lg hover:scale-105 hover:bg-slate-100'
              : 'bg-white/15 text-slate-300 cursor-not-allowed'
          }`}
          onClick={handlePlay}
        >
          {canPlay ? (
            <Play className='ml-1 h-7 w-7' />
          ) : (
            <Lock className='h-7 w-7' />
          )}
        </button>

        <h3 className='max-w-2xl text-lg font-semibold'>{title}</h3>
        {duration && <p className='mt-2 text-sm text-slate-300'>{duration}</p>}

        <div className='mt-4 flex flex-wrap items-center justify-center gap-2'>
          {isPreview && (
            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/20'>
              <Eye className='h-3.5 w-3.5' />
              <span>Preview</span>
            </span>
          )}
          {!canPlay && (
            <span className='inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200 ring-1 ring-white/10'>
              <Lock className='h-3.5 w-3.5' />
              <span>Enroll to Access</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
