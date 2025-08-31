import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface CourseImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackUrl?: string;
  showLoadingSpinner?: boolean;
}

const CourseImage: React.FC<CourseImageProps> = ({
  src,
  alt,
  className = '',
  fallbackUrl = 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=300',
  showLoadingSpinner = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src || fallbackUrl);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // If the current source failed and it's not already the fallback, try the fallback
    if (currentSrc !== fallbackUrl) {
      setCurrentSrc(fallbackUrl);
      setIsLoading(true);
      setHasError(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Loading Spinner */}
      {isLoading && showLoadingSpinner && (
        <div className='absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center'>
          <div className='w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className='absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center'>
          <ImageIcon className='w-8 h-8 text-gray-400 dark:text-gray-500' />
        </div>
      )}

      {/* Actual Image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default CourseImage;
