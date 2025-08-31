import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface UploadProgress {
  id: string;
  fileName: string;
  fileType: 'image' | 'video';
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  url?: string;
  startTime: number;
}

interface UploadContextType {
  uploads: UploadProgress[];
  addUpload: (upload: Omit<UploadProgress, 'id' | 'startTime'>) => string;
  updateUpload: (id: string, updates: Partial<UploadProgress>) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
  getActiveUploads: () => UploadProgress[];
  getTotalProgress: () => number;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};

interface UploadProviderProps {
  children: ReactNode;
}

export const UploadProvider: React.FC<UploadProviderProps> = ({ children }) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const addUpload = useCallback((upload: Omit<UploadProgress, 'id' | 'startTime'>) => {
    const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUpload: UploadProgress = {
      ...upload,
      id,
      startTime: Date.now(),
    };

    setUploads(prev => [...prev, newUpload]);
    return id;
  }, []);

  const updateUpload = useCallback((id: string, updates: Partial<UploadProgress>) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id ? { ...upload, ...updates } : upload
      )
    );
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(upload => 
      upload.status !== 'completed' && upload.status !== 'error'
    ));
  }, []);

  const getActiveUploads = useCallback(() => {
    return uploads.filter(upload => upload.status === 'uploading');
  }, [uploads]);

  const getTotalProgress = useCallback(() => {
    const activeUploads = getActiveUploads();
    if (activeUploads.length === 0) return 0;
    
    const totalProgress = activeUploads.reduce((sum, upload) => sum + upload.progress, 0);
    return Math.round(totalProgress / activeUploads.length);
  }, [getActiveUploads]);

  const value: UploadContextType = {
    uploads,
    addUpload,
    updateUpload,
    removeUpload,
    clearCompleted,
    getActiveUploads,
    getTotalProgress,
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
};

// Custom hook for file uploads with progress tracking
export const useFileUpload = () => {
  const { addUpload, updateUpload } = useUpload();

  const uploadFile = useCallback(
    async (
      file: File,
      endpoint: string,
      fileType: 'image' | 'video'
    ): Promise<any> => {
      const uploadId = addUpload({
        fileName: file.name,
        fileType,
        progress: 0,
        status: 'uploading',
      });

      try {
        const formData = new FormData();

        // Determine field name based on endpoint
        let fieldName = 'courseImage'; // default
        if (endpoint.includes('course-video')) {
          fieldName = 'courseVideo';
        } else if (endpoint.includes('section-video')) {
          fieldName = 'sectionVideo';
        } else if (endpoint.includes('lesson-video')) {
          fieldName = 'lessonVideo';
        } else if (fileType === 'video') {
          fieldName = 'courseVideo';
        }

        formData.append(fieldName, file);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Create XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              updateUpload(uploadId, { progress });
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.success && response.data) {
                  // Get the appropriate URL for display
                  const url =
                    response.data.imageUrl ||
                    response.data.videoUrl ||
                    response.data.location;
                  updateUpload(uploadId, {
                    status: 'completed',
                    progress: 100,
                    url,
                  });
                  // Return the full response data for the components to use
                  resolve(response.data);
                } else {
                  throw new Error(response.message || 'Upload failed');
                }
              } catch (parseError) {
                throw new Error('Invalid response format');
              }
            } else {
              throw new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
            }
          });

          xhr.addEventListener('error', () => {
            const error = 'Network error occurred during upload';
            updateUpload(uploadId, {
              status: 'error',
              error,
            });
            reject(new Error(error));
          });

          xhr.addEventListener('abort', () => {
            updateUpload(uploadId, {
              status: 'cancelled',
            });
            reject(new Error('Upload cancelled'));
          });

          xhr.open(
            'POST',
            `${import.meta.env.VITE_API_BASE_URL}/admin/${endpoint}`
          );
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(formData);
        });
      } catch (error: any) {
        updateUpload(uploadId, {
          status: 'error',
          error: error.message || 'Upload failed',
        });
        throw error;
      }
    },
    [addUpload, updateUpload]
  );

  return { uploadFile };
};
