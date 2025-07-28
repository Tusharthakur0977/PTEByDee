import React, { useState, useEffect } from 'react';
import { Play, Lock, Eye, Loader } from 'lucide-react';
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
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [secureVideoUrl, setSecureVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const canPlay = isPreview || isEnrolled;

  // Load secure video URL when needed
  useEffect(() => {
    console.log('VideoPlayer - Props:', {
      videoUrl,
      videoKey,
      courseId,
      isEnrolled,
      isPreview,
    });
    if (videoKey && courseId && isEnrolled && !isPreview) {
      console.log('VideoPlayer - Loading secure URL for videoKey:', videoKey);
      loadSecureVideoUrl();
    }
  }, [videoKey, courseId, isEnrolled, isPreview]);

  const loadSecureVideoUrl = async () => {
    if (!videoKey || !courseId) {
      console.log('VideoPlayer - Missing videoKey or courseId:', {
        videoKey,
        courseId,
      });
      return;
    }

    try {
      console.log('VideoPlayer - Starting secure URL load for:', {
        videoKey,
        courseId,
      });
      setIsLoadingVideo(true);
      setVideoError(null);
      const response = await getSecureVideoUrl(videoKey, courseId);
      console.log('VideoPlayer - Secure URL response:', response);
      console.log('VideoPlayer - Setting secure URL:', response.secureUrl);
      setSecureVideoUrl(response.secureUrl);
      console.log('VideoPlayer - Secure URL state should be updated');
    } catch (error: any) {
      console.error('VideoPlayer - Failed to load secure video URL:', error);
      setVideoError('Failed to load video. Please try again.');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Determine which video URL to use
  const getVideoUrl = () => {
    // For enrolled users with videoKey, use secure URL if available
    if (isEnrolled && videoKey && secureVideoUrl) {
      console.log('VideoPlayer - Using secure URL:', secureVideoUrl);
      return secureVideoUrl;
    }
    // Fallback to direct URL for preview, legacy videos, or if secure URL failed
    if (videoUrl) {
      console.log('VideoPlayer - Using direct URL:', videoUrl);
      return videoUrl;
    }
    console.log('VideoPlayer - No video URL available');
    return null;
  };

  const handlePlay = async () => {
    const currentVideoUrl = getVideoUrl();

    console.log(
      'VideoPlayer - handlePlay called, currentVideoUrl:',
      currentVideoUrl
    );

    if (canPlay && currentVideoUrl) {
      console.log('VideoPlayer - Playing video with URL:', currentVideoUrl);
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
      // Try to load secure URL if not already loaded
      console.log('VideoPlayer - Attempting to load secure URL');
      try {
        setIsLoadingVideo(true);
        const response = await getSecureVideoUrl(videoKey, courseId);
        console.log('VideoPlayer - Got secure URL response:', response);
        setSecureVideoUrl(response.secureUrl);

        // Now play with the new URL
        if (response.secureUrl) {
          console.log(
            'VideoPlayer - Playing video with new secure URL:',
            response.secureUrl
          );
          setIsPlaying(true);
          onPlay?.();
        }
      } catch (error) {
        console.error('VideoPlayer - Error loading secure URL:', error);
        setVideoError('Failed to load video. Please try again.');
      } finally {
        setIsLoadingVideo(false);
      }
    } else {
      console.log('VideoPlayer - Cannot play video:', {
        canPlay,
        currentVideoUrl,
        videoKey,
        courseId,
        isEnrolled,
      });
    }
  };

  const getEmbedUrl = (url: string) => {
    // Handle different video URL formats
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // Convert YouTube URLs to embed format
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      }
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.includes('vimeo.com')) {
      // Convert Vimeo URLs to embed format
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }

    // For direct video files or other formats
    return url;
  };

  const currentVideoUrl = getVideoUrl();

  if (isPlaying && currentVideoUrl && canPlay) {
    return (
      <div
        className={`relative w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}
      >
        {currentVideoUrl.includes('youtube.com') ||
        currentVideoUrl.includes('youtu.be') ||
        currentVideoUrl.includes('vimeo.com') ? (
          <div className='relative w-full h-0 pb-[56.25%]'>
            {/* 16:9 aspect ratio */}
            <iframe
              src={getEmbedUrl(currentVideoUrl)}
              className='absolute top-0 left-0 w-full h-full'
              style={{ border: 0 }}
              allowFullScreen
              title={title}
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            />
          </div>
        ) : (
          <div>
            <video
              src={currentVideoUrl}
              controls
              className='w-full h-auto'
              title={title}
              onLoadStart={() => console.log('Video loading started')}
              onError={(e) => console.error('Video error:', e)}
              onCanPlay={() => console.log('Video can play')}
              onPlay={() => console.log('Video started playing')}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>
    );
  }

  // Show loading state for secure video URL
  if (isLoadingVideo && canPlay) {
    return (
      <div
        className={`relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center ${className}`}
      >
        <div className='text-center text-white'>
          <Loader className='h-8 w-8 animate-spin mx-auto mb-2' />
          <p className='text-sm'>Loading video...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (videoError && canPlay) {
    return (
      <div
        className={`relative w-full h-64 bg-red-900/20 border border-red-600 rounded-lg overflow-hidden flex items-center justify-center ${className}`}
      >
        <div className='text-center text-red-400'>
          <p className='text-sm mb-2'>{videoError}</p>
          <button
            onClick={loadSecureVideoUrl}
            className='text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden group cursor-pointer ${className}`}
    >
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-10'>
        <div className='w-full h-full bg-gradient-to-r from-blue-600 to-purple-600'></div>
      </div>

      {/* Content */}
      <div className='relative h-full flex items-center justify-center'>
        <div className='text-center text-white'>
          {/* Play Button */}
          <div
            className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              canPlay
                ? 'bg-blue-600 hover:bg-blue-700 hover:scale-110 cursor-pointer'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
            onClick={handlePlay}
          >
            {canPlay ? (
              <Play className='h-8 w-8 text-white ml-1' />
            ) : (
              <Lock className='h-8 w-8 text-gray-300' />
            )}
          </div>

          {/* Title */}
          <h3 className='text-lg font-semibold mb-2 px-4'>{title}</h3>

          {/* Duration */}
          {duration && <p className='text-sm text-gray-300 mb-2'>{duration}</p>}

          {/* Status */}
          <div className='flex items-center justify-center space-x-2'>
            {isPreview && (
              <span className='flex items-center space-x-1 text-xs bg-green-600 px-2 py-1 rounded-full'>
                <Eye className='h-3 w-3' />
                <span>Preview</span>
              </span>
            )}
            {!canPlay && (
              <span className='flex items-center space-x-1 text-xs bg-gray-600 px-2 py-1 rounded-full'>
                <Lock className='h-3 w-3' />
                <span>Enroll to Access</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      {canPlay && (
        <div className='absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none'></div>
      )}
    </div>
  );
};

export default VideoPlayer;
