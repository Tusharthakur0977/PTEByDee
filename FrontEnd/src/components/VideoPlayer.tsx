import React, { useState } from 'react';
import { Play, Lock, Eye } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  title: string;
  duration?: string;
  isPreview?: boolean;
  isEnrolled?: boolean;
  onPlay?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  duration,
  isPreview = false,
  isEnrolled = false,
  onPlay
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const canPlay = isPreview || isEnrolled;

  const handlePlay = () => {
    if (canPlay && videoUrl) {
      setIsPlaying(true);
      onPlay?.();
    }
  };

  const getEmbedUrl = (url: string) => {
    // Convert Udemy course URL to embed URL
    // Example: https://www.udemy.com/course/course-name/learn/lecture/12345678
    // To: https://www.udemy.com/course/course-name/learn/lecture/12345678#overview
    
    if (url.includes('udemy.com')) {
      return url;
    }
    return url;
  };

  if (isPlaying && videoUrl && canPlay) {
    return (
      <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden">
        <iframe
          src={getEmbedUrl(videoUrl)}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden group cursor-pointer">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center text-white">
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
              <Play className="h-8 w-8 text-white ml-1" />
            ) : (
              <Lock className="h-8 w-8 text-gray-300" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold mb-2 px-4">{title}</h3>

          {/* Duration */}
          {duration && (
            <p className="text-sm text-gray-300 mb-2">{duration}</p>
          )}

          {/* Status */}
          <div className="flex items-center justify-center space-x-2">
            {isPreview && (
              <span className="flex items-center space-x-1 text-xs bg-green-600 px-2 py-1 rounded-full">
                <Eye className="h-3 w-3" />
                <span>Preview</span>
              </span>
            )}
            {!canPlay && (
              <span className="flex items-center space-x-1 text-xs bg-gray-600 px-2 py-1 rounded-full">
                <Lock className="h-3 w-3" />
                <span>Enroll to Access</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      {canPlay && (
        <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
    </div>
  );
};

export default VideoPlayer;