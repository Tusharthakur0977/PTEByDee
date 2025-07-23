import React, { useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Minimize2, Maximize2 } from 'lucide-react';
import { useUpload } from '../contexts/UploadContext';

const UploadProgressIndicator: React.FC = () => {
  const { uploads, removeUpload, clearCompleted, getActiveUploads, getTotalProgress } = useUpload();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const activeUploads = getActiveUploads();
  const hasActiveUploads = activeUploads.length > 0;
  const hasCompletedUploads = uploads.some(upload => upload.status === 'completed' || upload.status === 'error');

  // Don't show if no uploads
  if (uploads.length === 0 || !isVisible) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (startTime: number): string => {
    const duration = Date.now() - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'uploading':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Upload className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Uploads ({uploads.length})
          </span>
          {hasActiveUploads && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {getTotalProgress()}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4 text-gray-500" />
            ) : (
              <Minimize2 className="h-4 w-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="max-h-64 overflow-y-auto">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1 min-w-0">
                  {getStatusIcon(upload.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {upload.fileName}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {upload.fileType}
                      </span>
                      {upload.status === 'uploading' && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDuration(upload.startTime)}
                        </span>
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    {upload.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${getStatusColor(upload.status)}`}
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>{upload.progress}%</span>
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {upload.status === 'error' && upload.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {upload.error}
                      </p>
                    )}

                    {/* Success message */}
                    {upload.status === 'completed' && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Upload completed successfully
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Remove button */}
                {(upload.status === 'completed' || upload.status === 'error') && (
                  <button
                    onClick={() => removeUpload(upload.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ml-2"
                  >
                    <X className="h-3 w-3 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {!isMinimized && hasCompletedUploads && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={clearCompleted}
            className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Clear completed uploads
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadProgressIndicator;
