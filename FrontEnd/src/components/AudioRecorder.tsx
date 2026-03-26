import {
  AlertCircle,
  Info,
  Mic,
  RotateCcw,
  Square,
  Upload,
  Volume2,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete?: (audioKey: string) => void;
  onRecordingStart?: () => void;
  onManualStart?: () => void;
  maxDuration?: number;
  className?: string;
  autoUpload?: boolean;
  disabled?: boolean;
  showWaveform?: boolean;
  ref?: React.Ref<any>;
  title?: string;
}

const AudioRecorder = React.forwardRef<any, AudioRecorderProps>(
  (
    {
      onRecordingComplete,
      onRecordingStart,
      onManualStart,
      maxDuration = 300,
      className = '',
      autoUpload = true,
      disabled = false,
      title = 'Recording will start automatically when the audio finishes, or you can click the button below to start manually.',
    },
    ref,
  ) => {
    const {
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
      stopAndRelease,
    } = useAudioRecorder();

    const [hasUploadedSuccessfully, setHasUploadedSuccessfully] =
      React.useState(false);

    useEffect(() => {
      if (maxDuration && recordingTime >= maxDuration) stopRecording();
    }, [recordingTime, maxDuration, stopRecording]);

    useEffect(() => {
      if (audioURL && autoUpload && !hasUploadedSuccessfully) handleUpload();
    }, [audioURL, autoUpload, hasUploadedSuccessfully]);

    useEffect(() => {
      if (!audioURL) {
        setHasUploadedSuccessfully(false);
        resetUploadState();
      }
    }, [audioURL, resetUploadState]);

    const handleUpload = async () => {
      if (!audioBlob || hasUploadedSuccessfully) return;
      const audioKey = await uploadAudio();

      if (audioKey) {
        setHasUploadedSuccessfully(true);
        onRecordingComplete?.(audioKey);
      }
    };

    const handleStartRecording = async () => {
      if (disabled) return;
      setHasUploadedSuccessfully(false);
      await startRecording();
      onRecordingStart?.();
    };

    React.useImperativeHandle(ref, () => ({
      startRecording: handleStartRecording,
      stopRecording,
      stopAndRelease,
      clearRecording,
    }));

    const formatTime = (s: number) =>
      `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    if (!isSupported) {
      return (
        <div className='p-4 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300'>
          Audio recording is not supported in this browser.
        </div>
      );
    }

    return (
      <div
        className={`space-y-4 ${className} flex flex-col items-center justify-between`}
      >
        <div className='flex items-center gap-10 justify-evenly'>
          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3'>
            <p className='text-xs text-blue-700 dark:text-blue-300'>{title}</p>
          </div>
          <div className='relative group flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-300'>
            <Info className='w-4 h-4 text-blue-600 dark:text-blue-400' />
            <span className='font-medium text-blue-700 dark:text-blue-300'>
              Recording tips
            </span>

            {/* Tooltip */}
            <div className='absolute top-full mt-2 hidden group-hover:block w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-3 text-xs text-gray-700 dark:text-gray-200 z-50'>
              <ul className='space-y-1'>
                <li>• Ensure you are in a quiet environment</li>
                <li>• Speak clearly at a natural pace</li>
                <li>• Keep a steady distance from the microphone</li>
                <li>• Recording is one continuous attempt</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className='dark:bg-gray-800 py-3 w-[100%] flex-1'>
          {/* Idle / Start Recording State */}
          {!isRecording && !audioURL && (
            <div className='flex flex-col items-center w-full py-6 px-4 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-lg'>
              {/* Mic Visual */}
              <div className='relative mb-3'>
                {/* Soft blue pulse */}
                <div className='absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30'></div>

                {/* Mic circle */}
                <div
                  onClick={onManualStart || handleStartRecording}
                  className='cursor-pointer relative p-2 rounded-full bg-blue-600 flex items-center justify-center shadow-md'
                >
                  <Mic className='w-4 h-4 text-white' />
                </div>
              </div>

              {/* Primary CTA */}
              <button
                onClick={onManualStart || handleStartRecording}
                disabled={disabled}
                className={`px-6 py-2 rounded-md text-xs font-semibold transition-all
                  ${
                    disabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                  }`}
              >
                Start Recording
              </button>

              {/* Helper text */}
              <p className='mt-3 text-xs text-gray-700 dark:text-gray-300 text-center leading-relaxed'>
                Speak clearly into your microphone. This recording is a{' '}
                <span className='font-medium'>single continuous attempt</span>.
              </p>
            </div>
          )}

          {/* Recording Is In Progress */}
          {isRecording && (
            <div className='w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-4'>
              {/* Top row: Mic + REC */}
              <div className='flex items-center gap-4 mb-3'>
                {/* Mic with pulse */}
                <div className='relative'>
                  <div className='absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30'></div>
                  <div className='relative w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-md'>
                    <Mic className='w-5 h-5 text-white' />
                  </div>
                </div>

                {/* REC text + timer */}
                <div className='flex flex-col'>
                  <div className='flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300'>
                    <span className='inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse'></span>
                    Recording…
                  </div>
                  <span className='font-mono text-lg text-red-800 dark:text-red-200'>
                    {formatTime(recordingTime)}
                  </span>
                </div>

                {/* Stop button */}
                <div className='ml-auto'>
                  <button
                    onClick={stopRecording}
                    className='flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm'
                  >
                    <Square className='w-4 h-4' />
                    Stop
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {maxDuration && (
                <div className='mt-2'>
                  <div className='flex justify-between text-xs text-red-700 dark:text-red-300 mb-1'>
                    <span>Time elapsed</span>
                    <span>Max {formatTime(maxDuration)}</span>
                  </div>
                  <div className='w-full h-2 bg-red-200 dark:bg-red-900/40 rounded-full'>
                    <div
                      className='h-2 bg-red-600 rounded-full transition-all'
                      style={{
                        width: `${Math.min(
                          (recordingTime / maxDuration) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Warning line */}
              <p className='mt-3 text-xs text-red-700 dark:text-red-300 text-center'>
                Recording is live. This is a single continuous attempt.
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className='w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-4'>
              {/* Top row */}
              <div className='flex items-center gap-4 mb-3'>
                {/* Upload icon */}
                <div className='relative'>
                  <div className='absolute inset-0 rounded-full bg-blue-300 animate-ping opacity-30'></div>
                  <div className='relative w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-md'>
                    <Upload className='w-5 h-5 text-white' />
                  </div>
                </div>

                {/* Status text */}
                <div className='flex flex-col'>
                  <span className='text-sm font-semibold text-blue-800 dark:text-blue-200'>
                    Uploading response…
                  </span>
                  <span className='text-xs text-blue-700 dark:text-blue-300'>
                    Please wait, do not refresh the page
                  </span>
                </div>

                {/* Percentage */}
                <div className='ml-auto text-sm font-mono text-blue-800 dark:text-blue-200'>
                  {uploadProgress}%
                </div>
              </div>

              {/* Progress bar */}
              <div className='w-full h-2 bg-blue-200 dark:bg-blue-900/40 rounded-full'>
                <div
                  className='h-2 bg-blue-600 rounded-full transition-all duration-300'
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Playback */}
          {audioURL && !isUploading && (
            <div className='w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-4'>
              {/* Header */}
              <div className='flex items-center gap-3 mb-3'>
                {/* Icon */}
                <div className='w-10 h-10 rounded-full bg-green-600 flex items-center justify-center shadow-sm'>
                  <Volume2 className='w-5 h-5 text-white' />
                </div>

                {/* Status text */}
                <div className='flex flex-col'>
                  <span className='text-sm font-semibold text-green-800 dark:text-green-200'>
                    Recording complete
                  </span>
                  <span className='text-xs text-green-700 dark:text-green-300'>
                    Duration · {formatTime(recordingTime)}
                  </span>
                </div>

                {/* Upload status badge */}
                {uploadSuccess && (
                  <div className='ml-auto px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-200 rounded-full border border-green-200 dark:border-green-700'>
                    Uploaded
                  </div>
                )}
              </div>

              {/* Audio player */}
              <div className='py-2 flex items-center justify-between'>
                <audio
                  controls
                  src={audioURL}
                  className='w-[80%] h-9'
                  preload='metadata'
                />
                {}
              </div>

              {/* Error (if any) */}
              {uploadError && (
                <div className='mb-3 flex items-center gap-2 text-xs text-red-600'>
                  <AlertCircle className='w-4 h-4' />
                  Upload failed. Please try again.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

AudioRecorder.displayName = 'AudioRecorder';
export default AudioRecorder;
