import React, { useState, useRef, useCallback } from 'react';
import { X, Video, AlertCircle, CheckCircle, Play } from 'lucide-react';
import { useFileUpload } from '../contexts/UploadContext';

interface VideoUploadProps {
  onVideoUpload: (videoUrl: string) => void;
  currentVideoUrl?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoUpload,
  currentVideoUrl,
  className = '',
  label = 'Course Video',
  required = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentVideoUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useFileUpload();

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
    ];
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only MP4, WebM, MOV, and AVI videos are allowed.';
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return 'File size too large. Maximum size allowed is 100MB.';
    }

    return null;
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file using the upload context
        const videoUrl = await uploadFile(file, 'upload/course-video', 'video');

        // Update with the actual S3 URL
        setPreviewUrl(videoUrl);
        onVideoUpload(videoUrl);
        setError(null);
      } catch (err: any) {
        console.error('Upload error:', err);
        setError(err.message || 'Failed to upload video');
        setPreviewUrl(currentVideoUrl || null);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile, onVideoUpload, currentVideoUrl]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveVideo = () => {
    setPreviewUrl(null);
    setError(null);
    onVideoUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </label>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${isUploading ? 'pointer-events-none opacity-75' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type='file'
          accept='video/mp4,video/webm,video/quicktime,video/x-msvideo'
          onChange={handleFileInputChange}
          className='hidden'
          disabled={isUploading}
        />

        {previewUrl ? (
          <div className='relative'>
            <div className='relative w-full h-48 bg-black rounded-lg overflow-hidden'>
              <video
                src={previewUrl}
                className='w-full h-full object-contain'
                controls={!isUploading}
                preload='metadata'
              />
              {!isUploading && (
                <div className='absolute top-2 right-2 flex space-x-2'>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      const video =
                        e.currentTarget.parentElement?.parentElement?.querySelector(
                          'video'
                        );
                      if (video) {
                        if (video.paused) {
                          video.play();
                        } else {
                          video.pause();
                        }
                      }
                    }}
                    className='p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors'
                  >
                    <Play className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveVideo();
                    }}
                    className='p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
              )}
            </div>
            {isUploading && (
              <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg'>
                <div className='text-white text-center'>
                  <div className='w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
                  <p className='text-sm'>Uploading video...</p>
                  <p className='text-xs opacity-75'>
                    This may take a few minutes
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='text-center'>
            {isUploading ? (
              <div className='space-y-2'>
                <div className='w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto'></div>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Uploading video...
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-500'>
                  This may take a few minutes
                </p>
              </div>
            ) : (
              <>
                <Video className='mx-auto h-12 w-12 text-gray-400' />
                <div className='mt-4'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    <span className='font-medium text-blue-600 hover:text-blue-500'>
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-500 mt-1'>
                    MP4, WebM, MOV, AVI up to 100MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className='flex items-center space-x-2 text-red-600 text-sm'>
          <AlertCircle className='h-4 w-4' />
          <span>{error}</span>
        </div>
      )}

      {previewUrl && !isUploading && !error && (
        <div className='flex items-center space-x-2 text-green-600 text-sm'>
          <CheckCircle className='h-4 w-4' />
          <span>Video uploaded successfully</span>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
