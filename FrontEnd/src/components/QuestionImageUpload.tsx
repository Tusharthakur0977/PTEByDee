import {
  AlertCircle,
  CheckCircle,
  Eye,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { useFileUpload } from '../contexts/UploadContext';

interface QuestionImageUploadProps {
  onImageUpload: (imageData: { imageKey: string; imageUrl: string }) => void;
  currentImageUrl?: string;
  currentImageKey?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

const QuestionImageUpload: React.FC<QuestionImageUploadProps> = ({
  onImageUpload,
  currentImageUrl,
  currentImageKey,
  className = '',
  label = 'Question Image',
  required = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useFileUpload();

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.';
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'File size too large. Maximum size allowed is 5MB.';
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

        // Upload file using the question image endpoint
        const response = await uploadFile(
          file,
          'upload/question-image',
          'image'
        );

        // The response should contain both imageKey and imageUrl
        const imageData = {
          imageKey: response.imageKey || response.fileName,
          imageUrl: response.imageUrl || response.location,
        };

        // Update with the actual signed URL for preview
        if (response.imageUrl) {
          setPreviewUrl(response.imageUrl);
        }

        onImageUpload(imageData);
        setError(null);
      } catch (err: any) {
        console.error('Question image upload error:', err);
        setError(err.message || 'Failed to upload question image');
        setPreviewUrl(currentImageUrl || null);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile, onImageUpload, currentImageUrl]
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

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setError(null);
    onImageUpload({ imageKey: '', imageUrl: '' });
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
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer ${
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
          accept='image/jpeg,image/jpg,image/png,image/webp'
          onChange={handleFileInputChange}
          className='hidden'
          disabled={isUploading}
        />

        {previewUrl ? (
          <div className='relative'>
            <div className='relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden'>
              <img
                src={previewUrl}
                alt='Question preview'
                className='w-full h-full object-contain'
              />
              {!isUploading && (
                <div className='absolute top-2 right-2 flex space-x-2'>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(previewUrl, '_blank');
                    }}
                    className='p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors'
                  >
                    <Eye className='h-3 w-3' />
                  </button>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className='p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
              )}
            </div>
            {isUploading && (
              <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg'>
                <div className='text-center text-white'>
                  <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1'></div>
                  <p className='text-xs'>Uploading...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='text-center'>
            {isUploading ? (
              <div className='space-y-2'>
                <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto'></div>
                <p className='text-xs text-gray-600 dark:text-gray-400'>
                  Uploading question image...
                </p>
              </div>
            ) : (
              <>
                <ImageIcon className='mx-auto h-8 w-8 text-gray-400' />
                <div className='mt-2'>
                  <p className='text-xs text-gray-600 dark:text-gray-400'>
                    <span className='font-medium text-blue-600 hover:text-blue-500'>
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-500 mt-1'>
                    PNG, JPG, WebP up to 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className='flex items-center space-x-2 text-red-600 dark:text-red-400'>
          <AlertCircle className='h-3 w-3' />
          <span className='text-xs'>{error}</span>
        </div>
      )}

      {previewUrl && !isUploading && !error && (
        <div className='flex items-center space-x-2 text-green-600 dark:text-green-400'>
          <CheckCircle className='h-3 w-3' />
          <span className='text-xs'>Question image uploaded successfully</span>
        </div>
      )}
    </div>
  );
};

export default QuestionImageUpload;
