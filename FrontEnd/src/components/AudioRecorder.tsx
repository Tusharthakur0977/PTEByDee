import {
  AlertCircle,
  CheckCircle,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  Upload,
  Volume2,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete?: (audioKey: string) => void;
  maxDuration?: number; // in seconds
  className?: string;
  autoUpload?: boolean; // Automatically upload after recording
  disabled?: boolean;
  showWaveform?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 300, // 5 minutes default
  className = '',
  autoUpload = true,
  disabled = false,
  showWaveform = false,
}) => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioURL,
    audioBlob,
    isUploading,
    uploadProgress,
    uploadError,
    uploadSuccess,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    uploadAudio,
    isSupported,
    resetUploadState,
  } = useAudioRecorder();

  const [hasUploadedSuccessfully, setHasUploadedSuccessfully] =
    React.useState(false);

  useEffect(() => {
    if (maxDuration && recordingTime >= maxDuration) {
      stopRecording();
    }
  }, [recordingTime, maxDuration, stopRecording]);

  // Auto-upload when recording is complete
  useEffect(() => {
    if (audioURL && autoUpload && !hasUploadedSuccessfully) {
      handleUpload();
    }
  }, [audioURL, autoUpload, hasUploadedSuccessfully]);

  // Reset upload state when clearing recording
  useEffect(() => {
    if (!audioURL) {
      setHasUploadedSuccessfully(false);
      resetUploadState();
    }
  }, [audioURL, resetUploadState]);

  const handleUpload = async () => {
    if (!audioBlob || hasUploadedSuccessfully) return;

    try {
      const audioKey = await uploadAudio();
      if (audioKey) {
        setHasUploadedSuccessfully(true);
        onRecordingComplete?.(audioKey);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      // Error is already handled in the hook
    }
  };

  const handleStartRecording = async () => {
    if (disabled) return;

    try {
      setHasUploadedSuccessfully(false);
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(
        'Failed to start recording. Please check your microphone permissions and try again.'
      );
    }
  };

  const handleClearRecording = () => {
    clearRecording();
    setHasUploadedSuccessfully(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div
        className={`text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 ${className}`}
      >
        <AlertCircle className='h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-3' />
        <p className='text-red-600 dark:text-red-400 font-medium'>
          Audio recording is not supported in this browser.
        </p>
        <p className='text-red-500 dark:text-red-300 text-sm mt-2'>
          Please use a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Recording Controls */}
      <div className='flex items-center justify-center space-x-4'>
        {!isRecording && !audioURL && (
          <button
            onClick={handleStartRecording}
            disabled={disabled}
            className='flex items-center space-x-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Mic className='h-6 w-6' />
            <span>Start Recording</span>
          </button>
        )}

        {isRecording && (
          <div className='flex items-center space-x-4'>
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
          </div>
        )}

        {audioURL && !isUploading && (
          <button
            onClick={handleClearRecording}
            disabled={disabled}
            className='flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
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
              {isPaused ? 'Recording Paused' : 'Recording...'}
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

          {/* Progress bar for max duration */}
          {maxDuration && (
            <div className='mt-4'>
              <div className='w-full bg-red-200 dark:bg-red-800 rounded-full h-2'>
                <div
                  className='bg-red-600 h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${Math.min(
                      (recordingTime / maxDuration) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className='bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700'>
          <div className='flex items-center justify-center space-x-3 mb-4'>
            <Upload className='h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse' />
            <span className='text-blue-800 dark:text-blue-200 font-bold text-lg'>
              Uploading Audio...
            </span>
          </div>
          <div className='w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-3'>
            <div
              className='bg-blue-600 h-3 rounded-full transition-all duration-300'
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className='text-center text-blue-600 dark:text-blue-400 font-mono font-bold'>
            {uploadProgress}%
          </div>
          <div className='text-center mt-2 text-sm text-blue-600 dark:text-blue-400'>
            Please wait while we upload your recording...
          </div>
        </div>
      )}

      {/* Upload Success */}
      {uploadSuccess && !isUploading && (
        <div className='bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700'>
          <div className='flex items-center justify-center space-x-3 mb-4'>
            <CheckCircle className='h-6 w-6 text-green-600 dark:text-green-400' />
            <span className='text-green-800 dark:text-green-200 font-bold text-lg'>
              Upload Successful!
            </span>
          </div>
          <div className='text-center text-sm text-green-700 dark:text-green-300'>
            Your audio recording has been uploaded and is ready for evaluation.
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && !isUploading && (
        <div className='bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-700'>
          <div className='flex items-center justify-center space-x-3 mb-4'>
            <AlertCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
            <span className='text-red-800 dark:text-red-200 font-bold'>
              Upload Failed
            </span>
          </div>
          <p className='text-sm text-red-600 dark:text-red-400 text-center mb-4'>
            {uploadError}
          </p>
          {!autoUpload && audioBlob && (
            <div className='text-center'>
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
        <div className='bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700'>
          <div className='flex items-center justify-center space-x-3 mb-4'>
            <div className='bg-green-600 p-3 rounded-lg'>
              <Volume2 className='h-6 w-6 text-white' />
            </div>
            <div className='text-center'>
              <span className='text-green-800 dark:text-green-200 font-bold text-lg block'>
                Recording Complete
              </span>
              <span className='text-green-600 dark:text-green-400 text-sm'>
                Duration: {formatTime(recordingTime)}
              </span>
            </div>
          </div>

          <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700'>
            <audio
              controls
              src={audioURL}
              className='w-full'
              preload='metadata'
            >
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* Upload status indicator */}
          {uploadSuccess && (
            <div className='mt-4 text-center'>
              <div className='inline-flex items-center space-x-2 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-medium'>
                <CheckCircle className='h-4 w-4' />
                <span>Ready for evaluation</span>
              </div>
            </div>
          )}

          {uploadError && (
            <div className='mt-4 text-center'>
              <div className='inline-flex items-center space-x-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-full text-sm font-medium'>
                <AlertCircle className='h-4 w-4' />
                <span>Upload failed</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recording Tips */}
      {!isRecording && !audioURL && !disabled && (
        <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700'>
          <h4 className='text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2'>
            Recording Tips:
          </h4>
          <ul className='text-xs text-blue-700 dark:text-blue-400 space-y-1'>
            <li>• Ensure you're in a quiet environment</li>
            <li>• Speak clearly and at a normal pace</li>
            <li>• Keep your microphone at a consistent distance</li>
            <li>• You can pause and resume recording if needed</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
