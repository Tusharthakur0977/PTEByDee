import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Image as ImageIcon,
  FileText,
  Clock,
  Users,
} from 'lucide-react';

interface QuestionPreviewProps {
  question: any;
  onEdit: () => void;
  onDelete: () => void;
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({
  question,
  onEdit,
  onDelete,
}) => {
  const [playingAudio, setPlayingAudio] = useState(false);

  const handleAudioPlay = () => {
    const audio = document.getElementById(
      `audio-${question.id}`
    ) as HTMLAudioElement;
    if (audio) {
      if (playingAudio) {
        audio.pause();
        setPlayingAudio(false);
      } else {
        audio.play();
        setPlayingAudio(true);
        audio.onended = () => setPlayingAudio(false);
      }
    }
  };

  const formatQuestionTypeName = (name: string) => {
    return name
      .split('_')
      .map(
        (word: string) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(' ');
  };

  const formatDateTime = (value: string) => {
    if (!value) return '';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  const createdLabel = question.createdAt
    ? formatDateTime(question.createdAt)
    : '';
  const updatedLabel = question.updatedAt
    ? formatDateTime(question.updatedAt)
    : '';

  const getQuestionTypeColor = (typeName: string) => {
    const colors: { [key: string]: string } = {
      READ_aloud:
        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
      repeat_sentence:
        'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700',
      describe_image:
        'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700',
      re_tell_lecture:
        'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700',
      answer_short_question:
        'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700',
      summarize_written_text:
        'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700',
      write_essay:
        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
    };
    return (
      colors[typeName.toLowerCase()] ||
      'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/20 dark:text-gray-300 dark:border-gray-600'
    );
  };

  return (
    <div className='bg-white dark:bg-slate-900 p-6 transition-colors'>
      {/* Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
              {question.questionCode}
            </h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium border ${getQuestionTypeColor(
                question.questionType.name
              )}`}
            >
              {formatQuestionTypeName(question.questionType.name)}
            </span>
          </div>

          <div className='flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400'>
            <span className='flex items-center gap-1'>
              <FileText className='w-4 h-4' />
              {question.questionType.pteSection.name}
            </span>
            <span className='flex items-center gap-1'>
              <Users className='w-4 h-4' />
              {question.responseCount} responses
            </span>
            {question.durationMillis && (
              <span className='flex items-center gap-1'>
                <Clock className='w-4 h-4' />
                {Math.round(question.durationMillis / 1000)}s
              </span>
            )}
          </div>
          <div className='mt-1 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400'>
            {createdLabel && <span>Created {createdLabel}</span>}
            {updatedLabel && <span>Updated {updatedLabel}</span>}
          </div>
          {question.tags && question.tags.length > 0 && (
            <div className='mt-2 flex flex-wrap gap-2 text-xs'>
              {question.tags.map((tag: string) => (
                <span
                  key={tag}
                  className='rounded-full border border-slate-200 px-3 py-1 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={onEdit}
            className='rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className='rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30'
          >
            Delete
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className='space-y-4'>
        {/* Test Information */}
        {/* <div className='bg-gray-50 rounded-lg p-3'>
          <p className='text-sm font-medium text-gray-700'>
            Test: {question.test.title}
          </p>
          <p className='text-xs text-gray-600'>
            Order: #{question.orderInTest} • Type: {question.test.testType}
          </p>
        </div> */}

        {/* Text Content */}
        {question.textContent && (
          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
            <div className='flex items-center gap-2 mb-2'>
              {/* Use Volume2 icon for audio transcripts, FileText for regular text */}
              {question.audioUrl &&
              [
                'SUMMARIZE_SPOKEN_TEXT',
                'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
                'LISTENING_FILL_IN_THE_BLANKS',
                'HIGHLIGHT_CORRECT_SUMMARY',
                'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
                'SELECT_MISSING_WORD',
                'HIGHLIGHT_INCORRECT_WORDS',
                'WRITE_FROM_DICTATION',
                'REPEAT_SENTENCE',
                'RE_TELL_LECTURE',
                'ANSWER_SHORT_QUESTION',
              ].includes(question.questionType.name) ? (
                <Volume2 className='w-4 h-4 text-slate-500 dark:text-slate-400' />
              ) : (
                <FileText className='w-4 h-4 text-slate-500 dark:text-slate-400' />
              )}
              <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                {/* Show "Audio Transcript" for listening questions with audio, otherwise "Text Content" */}
                {question.audioUrl &&
                [
                  'SUMMARIZE_SPOKEN_TEXT',
                  'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
                  'LISTENING_FILL_IN_THE_BLANKS',
                  'HIGHLIGHT_CORRECT_SUMMARY',
                  'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
                  'SELECT_MISSING_WORD',
                  'HIGHLIGHT_INCORRECT_WORDS',
                  'WRITE_FROM_DICTATION',
                  'REPEAT_SENTENCE',
                  'RE_TELL_LECTURE',
                  'ANSWER_SHORT_QUESTION',
                ].includes(question.questionType.name)
                  ? 'Audio Transcript'
                  : 'Text Content'}
              </span>
              {/* Add transcript indicator */}
              {question.audioUrl &&
                [
                  'SUMMARIZE_SPOKEN_TEXT',
                  'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
                  'LISTENING_FILL_IN_THE_BLANKS',
                  'HIGHLIGHT_CORRECT_SUMMARY',
                  'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
                  'SELECT_MISSING_WORD',
                  'HIGHLIGHT_INCORRECT_WORDS',
                  'WRITE_FROM_DICTATION',
                  'REPEAT_SENTENCE',
                  'RE_TELL_LECTURE',
                  'ANSWER_SHORT_QUESTION',
                ].includes(question.questionType.name) && (
                  <span className='rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
                    Auto-generated
                  </span>
                )}
            </div>
            <p className='line-clamp-4 text-sm text-slate-600 dark:text-slate-400'>
              {question.textContent}
            </p>
          </div>
        )}

        {/* Audio Content */}
        {question.audioUrl && (
          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <Volume2 className='w-4 h-4 text-slate-500 dark:text-slate-400' />
                <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Audio Content
                </span>
              </div>
              <button
                onClick={handleAudioPlay}
                className='flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
              >
                {playingAudio ? (
                  <Pause className='w-3 h-3' />
                ) : (
                  <Play className='w-3 h-3' />
                )}
                {playingAudio ? 'Pause' : 'Play'}
              </button>
            </div>
            <audio
              id={`audio-${question.id}`}
              src={question.audioUrl}
              className='hidden'
              onEnded={() => setPlayingAudio(false)}
            />
            <p className='text-xs text-slate-500 dark:text-slate-400'>
              Audio file available for playback
            </p>
          </div>
        )}

        {/* Image Content */}
        {question.imageUrl && (
          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
            <div className='flex items-center gap-2 mb-3'>
              <ImageIcon className='w-4 h-4 text-slate-500 dark:text-slate-400' />
              <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                Image Content
              </span>
            </div>
            <img
              src={question.imageUrl}
              alt='Question'
              className='mx-auto h-48 w-full max-w-md rounded-xl border border-slate-200 object-cover dark:border-slate-700'
            />
          </div>
        )}

        {/* Options Preview - Only show for question types that use options */}
        {question.options &&
          Array.isArray(question.options) &&
          question.options.length > 0 &&
          [
            'MULTIPLE_CHOICE_SINGLE_ANSWER_READING',
            'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING',
            'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
            'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
            'HIGHLIGHT_CORRECT_SUMMARY',
            'SELECT_MISSING_WORD',
          ].includes(question.questionType.name) && (
            <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950'>
              <div className='flex items-center gap-2 mb-3'>
                <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                  Answer Options
                </span>
                <span className='rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
                  {question.options.length} options
                </span>
              </div>
              <div className='space-y-2'>
                {question.options.map((option: any, index: number) => (
                  <div
                    key={index}
                    className='flex items-center gap-2'
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        option.isCorrect
                          ? 'bg-slate-900 dark:bg-slate-100'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    <span className='text-sm text-slate-600 dark:text-slate-400'>
                      {option.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Word Count Info */}
        {(question.wordCountMin || question.wordCountMax) && (
          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950'>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
              Word Count: {question.wordCountMin}-{question.wordCountMax} words
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPreview;
