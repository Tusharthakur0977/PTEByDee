import React from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  Upload,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete?: (audioKey: string) => void;
  maxDuration?: number; // in seconds
  className?: string;
  autoUpload?: boolean; // Automatically upload after recording
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 300, // 5 minutes default
  className = '',
  autoUpload = true,
}) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioURL,
    audioBlob,
    isUploading,
    uploadProgress,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    uploadAudio,
    isSupported,
  } = useAudioRecorder();

  const [uploadStatus, setUploadStatus] = React.useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (maxDuration && recordingTime >= maxDuration) {
      stopRecording();
    }
  }, [recordingTime, maxDuration, stopRecording]);

  // Auto-upload when recording is complete
  React.useEffect(() => {
    if (audioURL && autoUpload) {
      handleUpload();
    }
  }, [audioURL, autoUpload]);

  const handleUpload = async () => {
    if (!audioBlob) return;

    try {
      setUploadStatus('idle');
      setUploadError(null);

      const audioKey = await uploadAudio();
      if (audioKey) {
        setUploadStatus('success');
        onRecordingComplete?.(audioKey);
      }
    } catch (error: any) {
      setUploadStatus('error');
      setUploadError(error.message || 'Upload failed');
      console.error('Upload error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(
        'Failed to start recording. Please check your microphone permissions.'
      );
    }
  };

  if (!isSupported) {
    return (
      <div
        className={`text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg ${className}`}
      >
        <p className='text-red-600 dark:text-red-400'>
          Audio recording is not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Recording Controls */}
      <div className='flex items-center justify-center space-x-6'>
        {!isRecording && !audioURL && (
          <button
            onClick={handleStartRecording}
            className='flex items-center space-x-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl'
          >
            <Mic className='h-6 w-6' />
            <span>Start Recording</span>
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className='flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl'
            >
              {isPaused ? (
                <Play className='h-5 w-5' />
              ) : (
                <Pause className='h-5 w-5' />
              )}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={stopRecording}
              className='flex items-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl'
            >
              <Square className='h-5 w-5' />
              <span>Stop</span>
            </button>
          </>
        )}

        {audioURL && (
          <button
            onClick={clearRecording}
            className='flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl'
          >
            <RotateCcw className='h-5 w-5' />
            <span>Record Again</span>
          </button>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className='text-center bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800'>
          <div className='flex items-center justify-center space-x-3 mb-4'>
            <div className='w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg'></div>
            <span className='text-red-700 dark:text-red-300 font-bold text-lg'>
              {isPaused ? 'Paused' : 'Recording'}
            </span>
          </div>
          <div className='text-4xl font-mono font-bold text-red-700 dark:text-red-300 mb-2'>
            {formatTime(recordingTime)}
          </div>
          {maxDuration && (
            <div className='text-sm font-medium text-red-600 dark:text-red-400'>
              Max: {formatTime(maxDuration)}
            </div>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700'>
          <div className='flex items-center justify-center space-x-3 mb-3'>
            <Upload className='h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse' />
            <span className='text-blue-800 dark:text-blue-200 font-medium'>
              Uploading audio...
            </span>
          </div>
          <div className='w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className='text-center mt-2 text-sm text-blue-600 dark:text-blue-400'>
            {uploadProgress}%
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploadStatus === 'success' && (
        <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700'>
          <div className='flex items-center justify-center space-x-3'>
            <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
            <span className='text-green-800 dark:text-green-200 font-medium'>
              Audio uploaded successfully!
            </span>
          </div>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className='bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700'>
          <div className='flex items-center justify-center space-x-3 mb-2'>
            <AlertCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
            <span className='text-red-800 dark:text-red-200 font-medium'>
              Upload failed
            </span>
          </div>
          {uploadError && (
            <p className='text-sm text-red-600 dark:text-red-400 text-center'>
              {uploadError}
            </p>
          )}
          {!autoUpload && (
            <div className='text-center mt-3'>
              <button
                onClick={handleUpload}
                className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors'
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Audio Playback */}
      {audioURL && !isUploading && (
        <div className='bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700'>
          <div className='flex items-center justify-center space-x-3 mb-4'>
            <div className='bg-green-600 p-2 rounded-lg'>
              <Volume2 className='h-5 w-5 text-white' />
            </div>
            <span className='text-green-800 dark:text-green-200 font-bold text-lg'>
              Recording Complete
            </span>
          </div>
          <audio
            controls
            src={audioURL}
            className='w-full mb-3'
            preload='metadata'
          >
            Your browser does not support the audio element.
          </audio>
          <div className='text-center'>
            <span className='inline-block bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium'>
              Duration: {formatTime(recordingTime)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
