import { FileAudio, Pause, Play, Upload, Volume2, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface AudioUploaderProps {
  onUpload: (file: File) => Promise<void>;
  audioKey?: string;
  audioUrl?: string;
  onRemove: () => void;
  loading?: boolean;
  className?: string;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({
  onUpload,
  audioKey,
  audioUrl,
  onRemove,
  loading = false,
  className = '',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find((file) => file.type.startsWith('audio/'));

    if (audioFile) {
      onUpload(audioFile);
    } else {
      alert('Please drop an audio file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleAudioPlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (audioKey) {
    return (
      <div
        className={`border border-green-200 rounded-lg p-6 bg-green-50 ${className}`}
      >
        <div className='text-center'>
          <FileAudio className='w-12 h-12 text-green-600 mx-auto mb-3' />
          <p className='text-sm font-medium text-green-800 mb-2'>
            Audio uploaded successfully
          </p>
          <p className='text-xs text-green-600 mb-4 font-mono'>{audioKey}</p>

          {audioUrl && (
            <div className='flex items-center justify-center gap-3 mb-4'>
              <button
                type='button'
                onClick={handleAudioPlay}
                className='flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
              >
                {playing ? (
                  <Pause className='w-4 h-4' />
                ) : (
                  <Play className='w-4 h-4' />
                )}
                {playing ? 'Pause' : 'Play'} Preview
              </button>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setPlaying(false)}
                className='hidden'
              />
            </div>
          )}

          <button
            type='button'
            onClick={onRemove}
            className='inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors'
          >
            <X className='w-4 h-4' />
            Remove Audio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <div>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
            <p className='text-sm text-gray-600'>Uploading audio file...</p>
          </div>
        ) : (
          <>
            <Volume2 className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Upload Audio File
            </h3>
            <p className='text-sm text-gray-600 mb-4'>
              Drag and drop your audio file here, or click to browse
            </p>

            <input
              ref={fileInputRef}
              type='file'
              accept='audio/*'
              onChange={handleFileSelect}
              className='hidden'
            />

            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium'
            >
              <Upload className='w-4 h-4' />
              Choose Audio File
            </button>

            <div className='mt-4 text-xs text-gray-500 space-y-1'>
              <p>Supported formats: MP3, WAV, OGG, M4A, AAC</p>
              <p>Maximum file size: 50MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioUploader;
