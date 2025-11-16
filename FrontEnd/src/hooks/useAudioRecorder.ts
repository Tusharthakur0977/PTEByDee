import { useCallback, useRef, useState } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  audioURL: string | null;
  audioBlob: Blob | null;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  uploadSuccess: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
  uploadAudio: () => Promise<string | null>;
  isSupported: boolean;
  resetUploadState: () => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    !!navigator.mediaDevices.getUserMedia;

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetUploadState = useCallback(() => {
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Audio recording is not supported in this browser');
    }

    try {
      // Reset upload state when starting new recording
      resetUploadState();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: 'audio/webm;codecs=opus',
        });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setAudioBlob(blob);

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, [isSupported, startTimer, resetUploadState]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  }, [isRecording, stopTimer]);

  const clearRecording = useCallback(() => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
    setAudioBlob(null);
    setRecordingTime(0);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(false);
    chunksRef.current = [];
  }, [audioURL]);

  const uploadAudio = useCallback(async (): Promise<string | null> => {
    if (!audioBlob) {
      throw new Error('No audio recording available to upload');
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadSuccess(false);

      // Create FormData for file upload
      const formData = new FormData();
      const fileName = `recording_${Date.now()}.webm`;
      formData.append('audio', audioBlob, fileName);

      // Upload to backend with progress tracking
      const response = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (parseError) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        const token = localStorage.getItem('token');
        xhr.open(
          'POST',
          `${import.meta.env.VITE_API_BASE_URL}/user/upload-audio`
        );
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });

      if (response.success && response.data) {
        setUploadSuccess(true);
        setUploadError(null);
        return response.data.audioKey; // Return S3 key
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed');
      setUploadSuccess(false);
      console.error('Error uploading audio:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [audioBlob]);

  return {
    isRecording,
    recordingTime,
    audioURL,
    audioBlob,
    isUploading,
    uploadProgress,
    uploadError,
    uploadSuccess,
    startRecording,
    stopRecording,
    clearRecording,
    uploadAudio,
    isSupported,
    resetUploadState,
  };
};
