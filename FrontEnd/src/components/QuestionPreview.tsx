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
    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow'>
      {/* Header */}
      <div className='flex items-start justify-between mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-3 mb-2'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {question.questionCode}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${getQuestionTypeColor(
                question.questionType.name
              )}`}
            >
              {formatQuestionTypeName(question.questionType.name)}
            </span>
          </div>

          <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300'>
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
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={onEdit}
            className='px-4 py-2 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium'
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className='px-4 py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium'
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
          <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4'>
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
                <Volume2 className='w-4 h-4 text-blue-600 dark:text-blue-400' />
              ) : (
                <FileText className='w-4 h-4 text-blue-600 dark:text-blue-400' />
              )}
              <span className='text-sm font-medium text-blue-800 dark:text-blue-300'>
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
                  <span className='text-xs bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full'>
                    Auto-generated
                  </span>
                )}
            </div>
            <p className='text-sm text-blue-700 dark:text-blue-300 line-clamp-4'>
              {question.textContent}
            </p>
          </div>
        )}

        {/* Audio Content */}
        {question.audioUrl && (
          <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <Volume2 className='w-4 h-4 text-green-600 dark:text-green-400' />
                <span className='text-sm font-medium text-green-800 dark:text-green-300'>
                  Audio Content
                </span>
              </div>
              <button
                onClick={handleAudioPlay}
                className='flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm'
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
            <p className='text-xs text-green-600 dark:text-green-400'>
              Audio file available for playback
            </p>
          </div>
        )}

        {/* Image Content */}
        {question.imageUrl && (
          <div className='bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <ImageIcon className='w-4 h-4 text-purple-600 dark:text-purple-400' />
              <span className='text-sm font-medium text-purple-800 dark:text-purple-300'>
                Image Content
              </span>
            </div>
            <img
              src={question.imageUrl}
              alt='Question'
              className='w-full max-w-md h-48 object-cover rounded-lg border border-purple-200 dark:border-purple-700 mx-auto'
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
            <div className='bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-3'>
                <span className='text-sm font-medium text-yellow-800 dark:text-yellow-300'>
                  Answer Options
                </span>
                <span className='text-xs bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full'>
                  {question.options.length} options
                </span>
              </div>
              <div className='space-y-2'>
                {question.options
                  .slice(0, 3)
                  .map((option: any, index: number) => (
                    <div
                      key={index}
                      className='flex items-center gap-2'
                    >
                      <div
                        className={`w-3 h-3 rounded-full ${
                          option.isCorrect
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                      <span className='text-sm text-yellow-700 dark:text-yellow-300'>
                        {option.text}
                      </span>
                    </div>
                  ))}
                {question.options.length > 3 && (
                  <p className='text-xs text-yellow-600 dark:text-yellow-400'>
                    +{question.options.length - 3} more options
                  </p>
                )}
              </div>
            </div>
          )}

        {/* Word Count Info */}
        {(question.wordCountMin || question.wordCountMax) && (
          <div className='bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3'>
            <span className='text-sm font-medium text-indigo-800 dark:text-indigo-300'>
              Word Count: {question.wordCountMin}-{question.wordCountMax} words
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPreview;
