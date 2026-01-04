import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCheck,
  CheckCircle,
  FileText,
  Lightbulb,
  List,
  LucideWholeWord,
  MessageSquare,
  Mic,
  Shuffle,
  TrendingUp,
  Volume2,
  X,
  XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PreviousResponse } from '../services/questionResponse';
import { formatScoringText } from '../utils/Helpers';

interface ResponseDetailModalProps {
  response: PreviousResponse | null;
  isOpen: boolean;
  onClose: () => void;
  questionType?: string;
}

const ResponseDetailModal: React.FC<ResponseDetailModalProps> = ({
  response,
  isOpen,
  onClose,
  questionType = '',
}) => {
  const [selectedError, setSelectedError] = useState<any>(null);

  const [expandedError, setExpandedError] = useState<string | null>(null);

  if (!isOpen || !response) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSummarizeWrittenTextAnalysis = (analysis: any) => {
    const scores = analysis.scores || {};
    const errorAnalysis = analysis.errorAnalysis || {};

    // Prepare pie chart data
    const pieData = [
      {
        name: 'Content',
        value: scores.content?.score || 0,
        max: scores.content?.max || 4,
      },
      {
        name: 'Form',
        value: scores.form?.score || 0,
        max: scores.form?.max || 1,
      },
      {
        name: 'Grammar',
        value: scores.grammar?.score || 0,
        max: scores.grammar?.max || 2,
      },
      {
        name: 'Vocabulary',
        value: scores.vocabulary?.score || 0,
        max: scores.vocabulary?.max || 2,
      },
    ];

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

    return (
      <div className='space-y-6'>
        {/* Score Breakdown with Pie Chart */}
        <div className='bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800'>
          <div className='flex items-center space-x-2 mb-6'>
            <TrendingUp className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            <h4 className='font-semibold text-gray-900 dark:text-white'>
              Score Breakdown
            </h4>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Pie Chart */}
            <div className='flex justify-center items-center'>
              <ResponsiveContainer
                width='100%'
                height={300}
              >
                <PieChart>
                  <Pie
                    data={pieData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, value, max }) => `${name}: ${value}/${max}`}
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: string, props: any) =>
                      `${value}/${props.payload.max}`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Component Scores */}
            <div className='space-y-3'>
              {pieData.map((item, index) => (
                <div
                  key={item.name}
                  className='bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center space-x-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: COLORS[index] }}
                      ></div>
                      <span className='font-medium text-gray-900 dark:text-white'>
                        {item.name}
                      </span>
                    </div>
                    <span className='text-lg font-bold text-gray-900 dark:text-white'>
                      {item.value}/{item.max}
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2'>
                    <div
                      className='h-2 rounded-full transition-all'
                      style={{
                        width: `${(item.value / item.max) * 100}%`,
                        backgroundColor: COLORS[index],
                      }}
                    ></div>
                  </div>
                  <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    {Math.round((item.value / item.max) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Analysis */}
        {(errorAnalysis.grammarErrors?.length > 0 ||
          errorAnalysis.spellingErrors?.length > 0 ||
          errorAnalysis.vocabularyIssues?.length > 0) && (
          <div className='bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800'>
            <div className='flex items-center space-x-2 mb-4'>
              <AlertCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
              <h4 className='font-semibold text-gray-900 dark:text-white'>
                Areas for Improvement
              </h4>
            </div>

            <div className='space-y-3'>
              {/* Grammar Errors */}
              {errorAnalysis.grammarErrors?.length > 0 && (
                <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-red-200 dark:border-red-800'>
                  <button
                    onClick={() =>
                      setExpandedError(
                        expandedError === 'grammar' ? null : 'grammar'
                      )
                    }
                    className='w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded transition-colors'
                  >
                    <span className='font-medium text-red-700 dark:text-red-300'>
                      Grammar Errors ({errorAnalysis.grammarErrors.length})
                    </span>
                    <span className='text-gray-500'>
                      {expandedError === 'grammar' ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedError === 'grammar' && (
                    <div className='mt-3 space-y-2 border-t border-gray-200 dark:border-gray-600 pt-3'>
                      {errorAnalysis.grammarErrors.map(
                        (error: any, idx: number) => (
                          <div
                            key={idx}
                            className='text-sm'
                          >
                            <p className='text-gray-700 dark:text-gray-300'>
                              <span className='bg-red-100 dark:bg-red-900/50 text-red-900 dark:text-red-200 px-2 py-1 rounded'>
                                {error.text}
                              </span>
                            </p>
                            <p className='text-gray-600 dark:text-gray-400 mt-1'>
                              💡 {error.suggestion}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Spelling Errors */}
              {errorAnalysis.spellingErrors?.length > 0 && (
                <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-orange-200 dark:border-orange-800'>
                  <button
                    onClick={() =>
                      setExpandedError(
                        expandedError === 'spelling' ? null : 'spelling'
                      )
                    }
                    className='w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded transition-colors'
                  >
                    <span className='font-medium text-orange-700 dark:text-orange-300'>
                      Spelling Errors ({errorAnalysis.spellingErrors.length})
                    </span>
                    <span className='text-gray-500'>
                      {expandedError === 'spelling' ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedError === 'spelling' && (
                    <div className='mt-3 space-y-2 border-t border-gray-200 dark:border-gray-600 pt-3'>
                      {errorAnalysis.spellingErrors.map(
                        (error: any, idx: number) => (
                          <div
                            key={idx}
                            className='text-sm'
                          >
                            <p className='text-gray-700 dark:text-gray-300'>
                              <span className='bg-orange-100 dark:bg-orange-900/50 text-orange-900 dark:text-orange-200 px-2 py-1 rounded'>
                                {error.text}
                              </span>
                            </p>
                            <p className='text-gray-600 dark:text-gray-400 mt-1'>
                              ✓ Correct:{' '}
                              <span className='font-medium'>
                                {error.suggestion}
                              </span>
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Vocabulary Issues */}
              {errorAnalysis.vocabularyIssues?.length > 0 && (
                <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800'>
                  <button
                    onClick={() =>
                      setExpandedError(
                        expandedError === 'vocabulary' ? null : 'vocabulary'
                      )
                    }
                    className='w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded transition-colors'
                  >
                    <span className='font-medium text-yellow-700 dark:text-yellow-300'>
                      Vocabulary Issues ({errorAnalysis.vocabularyIssues.length}
                      )
                    </span>
                    <span className='text-gray-500'>
                      {expandedError === 'vocabulary' ? '▼' : '▶'}
                    </span>
                  </button>
                  {expandedError === 'vocabulary' && (
                    <div className='mt-3 space-y-2 border-t border-gray-200 dark:border-gray-600 pt-3'>
                      {errorAnalysis.vocabularyIssues.map(
                        (error: any, idx: number) => (
                          <div
                            key={idx}
                            className='text-sm'
                          >
                            <p className='text-gray-700 dark:text-gray-300'>
                              <span className='bg-yellow-100 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 px-2 py-1 rounded'>
                                {error.text}
                              </span>
                            </p>
                            <p className='text-gray-600 dark:text-gray-400 mt-1'>
                              💡 {error.suggestion}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Word Count Info */}
        <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              Word Count
            </span>
            <span className='text-lg font-bold text-gray-900 dark:text-white'>
              {analysis.actualWordCount || 0} words
            </span>
          </div>
        </div>

        {/* Detailed Feedback by Component */}
        {analysis.feedback && (
          <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800'>
            <div className='flex items-center space-x-2 mb-4'>
              <MessageSquare className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              <h4 className='font-semibold text-gray-900 dark:text-white'>
                Detailed Feedback
              </h4>
            </div>

            <div className='space-y-4'>
              {analysis.feedback.summary && (
                <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                  <h5 className='font-medium text-gray-900 dark:text-white mb-2'>
                    Summary
                  </h5>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {analysis.feedback.summary}
                  </p>
                </div>
              )}

              {analysis.feedback.content && (
                <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                  <h5 className='font-medium text-gray-900 dark:text-white mb-2'>
                    Content
                  </h5>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {analysis.feedback.content}
                  </p>
                </div>
              )}

              {analysis.feedback.oralFluency && (
                <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                  <h5 className='font-medium text-gray-900 dark:text-white mb-2'>
                    Oral Fluency
                  </h5>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {analysis.feedback.oralFluency}
                  </p>
                </div>
              )}

              {analysis.feedback.pronunciation && (
                <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                  <h5 className='font-medium text-gray-900 dark:text-white mb-2'>
                    Pronunciation
                  </h5>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {analysis.feedback.pronunciation}
                  </p>
                </div>
              )}

              {analysis.feedback.form && (
                <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                  <h5 className='font-medium text-gray-900 dark:text-white mb-2'>
                    Form
                  </h5>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {analysis.feedback.form}
                  </p>
                </div>
              )}

              {analysis.feedback.grammar && (
                <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                  <h5 className='font-medium text-gray-900 dark:text-white mb-2'>
                    Grammar
                  </h5>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {analysis.feedback.grammar}
                  </p>
                </div>
              )}

              {analysis.feedback.vocabulary && (
                <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
                  <h5 className='font-medium text-gray-900 dark:text-white mb-2'>
                    Vocabulary
                  </h5>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {analysis.feedback.vocabulary}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUserResponse = () => {
    return (
      <>
        {(response.textResponse || response.detailedAnalysis.userText) && (
          <div className='text-center text-gray-500 dark:text-gray-400 py-8 flex flex-col gap-5'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <FileText className='h-5 w-5 text-gray-600 dark:text-gray-400' />
                <h4 className='font-semibold text-gray-900 dark:text-white'>
                  Your Response
                </h4>
              </div>
              <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600'>
                <p className='text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed text-sm'>
                  {response.textResponse || response.detailedAnalysis.userText}
                </p>
              </div>
            </div>
          </div>
        )}
        {response.audioResponseUrl && (
          <div className='text-center text-gray-500 dark:text-gray-400 py-8 flex flex-col gap-5'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Volume2 className='h-5 w-5 text-gray-600 dark:text-gray-400' />
                <h4 className='font-semibold text-gray-900 dark:text-white'>
                  Your Audio Response
                </h4>
              </div>
              <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600'>
                <audio
                  controls
                  src={response.audioResponseUrl}
                  className='w-full'
                  preload='metadata'
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          </div>
        )}
        {response.orderedItems && response.orderedItems.length > 0 && (
          <div className='text-center text-gray-500 dark:text-gray-400 py-8 flex flex-col gap-5'>
            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <List className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                <h4 className='font-semibold text-gray-900 dark:text-white'>
                  Your Ordered Items
                </h4>
              </div>
              <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
                <ol className='space-y-2'>
                  {response.orderedItems.map((item, index) => (
                    <li
                      key={index}
                      className='flex items-center space-x-3'
                    >
                      <div className='flex-shrink-0 w-6 h-6 bg-blue-600 dark:bg-blue-400 text-white rounded-full flex items-center justify-center text-sm font-semibold'>
                        {index + 1}
                      </div>
                      <span className='text-gray-900 dark:text-white'>
                        {item}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
        {response.highlightedWords && response.highlightedWords.length > 0 && (
          <div className='text-center text-gray-500 dark:text-gray-400 py-8 flex flex-col gap-5'>
            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <Shuffle className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                <h4 className='font-semibold text-gray-900 dark:text-white'>
                  Your Highlighted Words
                </h4>
              </div>
              <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
                <div className='flex flex-wrap gap-2'>
                  {response.highlightedWords.map((word, index) => (
                    <span
                      key={index}
                      className='px-3 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium'
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderCorrectAnswer = () => {
    if (questionType === 'ANSWER_SHORT_QUESTION') {
      return (
        <div className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <CheckCheck className='h-5 w-5 text-green-600 dark:text-green-400' />
            <h4 className='font-semibold text-gray-900 dark:text-white'>
              Correct Answer
            </h4>
          </div>
          <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600'>
            <p className='text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed text-sm'>
              {response.detailedAnalysis.correctAnswers[0]}
            </p>
          </div>
        </div>
      );
    }

    if (
      questionType === 'FILL_IN_THE_BLANKS_DRAG_AND_DROP' ||
      questionType === 'READING_FILL_IN_THE_BLANKS'
    ) {
      return (
        <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Blank-by-Blank Analysis
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {Object.entries(response.detailedAnalysis.blankResults || {}).map(
              ([blankKey, result]: [string, any]) => (
                <div
                  key={blankKey}
                  className={`p-4 rounded-lg border ${
                    result.isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-900 dark:text-white'>
                      {blankKey.replace('blank', 'Blank ')}
                    </span>
                    {result.isCorrect ? (
                      <span className='text-xs font-semibold px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'>
                        ✓ Correct
                      </span>
                    ) : (
                      <span className='text-xs font-semibold px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'>
                        ✗ Incorrect
                      </span>
                    )}
                  </div>
                  <div className='space-y-1 text-sm'>
                    <div>
                      <span className='text-gray-600 dark:text-gray-400'>
                        Your answer:{' '}
                      </span>
                      <span
                        className={`font-medium ${
                          result.isCorrect
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}
                      >
                        {result.userAnswer || '(not selected)'}
                      </span>
                    </div>
                    {!result.isCorrect && (
                      <div>
                        <span className='text-gray-600 dark:text-gray-400'>
                          Correct answer:{' '}
                        </span>
                        <span className='font-medium text-green-700 dark:text-green-300'>
                          {result.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
          {response.detailedAnalysis.explanation && (
            <div className='mt-4'>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                Explanation:
              </label>
              <div className='p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600'>
                <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                  {response.detailedAnalysis.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (
      questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING' ||
      questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING'
    ) {
      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Answer Details
          </h4>
          <div className='space-y-4'>
            {response.detailedAnalysis.correctSelected > 0 && (
              <div>
                <label className='text-sm font-medium text-green-700 dark:text-green-300 block mb-2'>
                  ✅ Correct Answers Selected (
                  {response.detailedAnalysis.correctSelected}):
                </label>
                <div className='space-y-2'>
                  {response.detailedAnalysis.selectedOptionTexts
                    ?.filter((_: any, idx: number) =>
                      response.detailedAnalysis.selectedOptions?.[idx]
                        ? response.detailedAnalysis.correctAnswers?.includes(
                            response.detailedAnalysis.selectedOptions[idx]
                          )
                        : false
                    )
                    .map((text: string, idx: number) => (
                      <div
                        key={idx}
                        className='p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800'
                      >
                        <p className='text-sm text-green-800 dark:text-green-200'>
                          {text}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {response.detailedAnalysis.incorrectlySelectedTexts?.length > 0 && (
              <div>
                <label className='text-sm font-medium text-red-700 dark:text-red-300 block mb-2'>
                  ❌ Incorrect Answers Selected (
                  {response.detailedAnalysis.incorrectlySelectedTexts.length}):
                </label>
                <div className='space-y-2'>
                  {response.detailedAnalysis.incorrectlySelectedTexts.map(
                    (text: string, idx: number) => (
                      <div
                        key={idx}
                        className='p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800'
                      >
                        <p className='text-sm text-red-800 dark:text-red-200'>
                          {text}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {response.detailedAnalysis.missedCorrectTexts?.length > 0 && (
              <div>
                <label className='text-sm font-medium text-yellow-700 dark:text-yellow-300 block mb-2'>
                  ⚠️ Missed Correct Answers (
                  {response.detailedAnalysis.missedCorrectTexts.length}):
                </label>
                <div className='space-y-2'>
                  {response.detailedAnalysis.missedCorrectTexts.map(
                    (text: string, idx: number) => (
                      <div
                        key={idx}
                        className='p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800'
                      >
                        <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                          {text}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (
      questionType === 'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING' ||
      questionType === 'MULTIPLE_CHOICE_SINGLE_ANSWER_READING' ||
      questionType === 'HIGHLIGHT_CORRECT_SUMMARY' ||
      questionType === 'SELECT_MISSING_WORD'
    ) {
      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Answer Details
          </h4>
          <div className='space-y-3'>
            <div>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3'>
                Your Answer:
              </label>
              <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 flex items-center'>
                <div className='w-4 h-4 rounded-full bg-blue-500 flex-shrink-0'></div>
                <p className='text-sm text-blue-800 dark:text-blue-200 ml-3 font-medium'>
                  {response.detailedAnalysis.selectedOptionText ||
                    'Not selected'}
                </p>
              </div>
            </div>
            {!response.isCorrect && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3'>
                  ✅ Correct Answer:
                </label>
                <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 flex items-center'>
                  <div className='w-4 h-4 rounded-full bg-green-500 flex-shrink-0'></div>
                  <p className='text-sm text-green-800 dark:text-green-200 ml-3 font-medium'>
                    {response.detailedAnalysis.correctOptionText || 'Unknown'}
                  </p>
                </div>
              </div>
            )}
            {response.detailedAnalysis.explanation && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                  💡 Explanation:
                </label>
                <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800'>
                  <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                    {response.detailedAnalysis.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (questionType === 'RE_ORDER_PARAGRAPHS') {
      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Paragraph Order Analysis
          </h4>
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                Your Order:
              </label>
              <div className='space-y-2'>
                {response.detailedAnalysis.userOrderText?.map(
                  (id: string, idx: number) => (
                    <div
                      key={idx}
                      className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800'
                    >
                      <p className='text-sm text-blue-800 dark:text-blue-200 leading-relaxed'>
                        <span className='font-semibold'>{idx + 1}.</span> {id}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {!response.isCorrect && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                  ✅ Correct Order:
                </label>
                <div className='space-y-2'>
                  {response.detailedAnalysis.correctOrderText?.map(
                    (id: string, idx: number) => (
                      <div
                        key={idx}
                        className='p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800'
                      >
                        <p className='text-sm text-green-800 dark:text-green-200 leading-relaxed'>
                          <span className='font-semibold'>{idx + 1}.</span> {id}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                Score:
              </label>
              <div className='p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600'>
                <p className='text-sm text-gray-700 dark:text-gray-300'>
                  {response.detailedAnalysis.correctPairs} out of{' '}
                  {response.detailedAnalysis.maxPairs} adjacent pairs correct
                </p>
              </div>
            </div>

            {response.detailedAnalysis.explanation && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                  💡 Explanation:
                </label>
                <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800'>
                  <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                    {response.detailedAnalysis.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (questionType === 'HIGHLIGHT_INCORRECT_WORDS') {
      const text = response.detailedAnalysis.textContent || '';
      const cleanedIncorrect = response.detailedAnalysis.cleanedIncorrect || [];
      const cleanedHighlighted =
        response.detailedAnalysis.cleanedHighlighted || [];

      return (
        <div className='space-y-6'>
          {/* Full Text with Color Coding */}
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
              Text with Word Analysis
            </h4>
            <div className='text-lg leading-relaxed bg-gray-50 dark:bg-gray-900 p-4 rounded-lg'>
              {text.split(' ').map((word: string, index: number) => {
                // Clean the word for comparison
                const cleanedWord = word
                  .toLowerCase()
                  .replace(/[.,!?;:'"()]/g, '');

                // Check if word is incorrect (in the incorrect words list)
                const isIncorrectWord = cleanedIncorrect.includes(cleanedWord);
                // Check if word was highlighted by user
                const wasHighlighted = cleanedHighlighted.includes(cleanedWord);

                // Determine color:
                // RED: Incorrect word that was correctly highlighted
                // BLUE: Incorrect word that was missed (not highlighted)
                // GREEN: Correct word (whether highlighted or not)

                let colorClass = '';
                if (isIncorrectWord && wasHighlighted) {
                  // RED: Correctly identified incorrect word
                  colorClass =
                    'bg-red-300 dark:bg-red-800 text-red-900 dark:text-red-100 font-semibold';
                } else if (isIncorrectWord && !wasHighlighted) {
                  // BLUE: Missed incorrect word
                  colorClass =
                    'bg-blue-300 dark:bg-blue-800 text-blue-900 dark:text-blue-100 font-semibold';
                } else {
                  // GREEN: Correct word
                  colorClass =
                    'bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-200';
                }

                return (
                  <span
                    key={index}
                    className={`inline-block px-1.5 py-0.5 mx-0.5 rounded-md ${colorClass}`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
            {/* Legend */}
            <div className='mt-4 grid grid-cols-3 gap-3'>
              <div className='flex items-center space-x-2'>
                <div className='w-4 h-4 bg-green-200 dark:bg-green-900/40 rounded'></div>
                <span className='text-xs text-gray-700 dark:text-gray-300'>
                  Correct
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-4 h-4 bg-red-300 dark:bg-red-800 rounded'></div>
                <span className='text-xs text-gray-700 dark:text-gray-300'>
                  Incorrect (Found)
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <div className='w-4 h-4 bg-blue-300 dark:bg-blue-800 rounded'></div>
                <span className='text-xs text-gray-700 dark:text-gray-300'>
                  Incorrect (Missed)
                </span>
              </div>
            </div>
          </div>

          {/* Answer Details */}
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
              Answer Details
            </h4>
            <div className='space-y-4'>
              {/* Correctly Identified - RED */}
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                  ✅ Correctly Identified (
                  {response.detailedAnalysis.correctHighlights}/
                  {response.detailedAnalysis.totalIncorrectWords}):
                </label>
                {cleanedHighlighted.filter((w: string) =>
                  cleanedIncorrect.includes(w)
                ).length > 0 ? (
                  <div className='space-y-2'>
                    {cleanedHighlighted
                      .filter((word: string) => cleanedIncorrect.includes(word))
                      .map((word: string, idx: number) => (
                        <div
                          key={idx}
                          className='p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800'
                        >
                          <p className='text-sm text-red-800 dark:text-red-200 font-medium'>
                            {word}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className='p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800'>
                    <p className='text-sm text-red-800 dark:text-red-200'>
                      No incorrect words were identified
                    </p>
                  </div>
                )}
              </div>

              {/* Missed Incorrect Words - BLUE */}
              {cleanedIncorrect.filter(
                (w: string) => !cleanedHighlighted.includes(w)
              ).length > 0 && (
                <div>
                  <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                    🔵 Missed Incorrect Words (
                    {
                      cleanedIncorrect.filter(
                        (w: string) => !cleanedHighlighted.includes(w)
                      ).length
                    }
                    ):
                  </label>
                  <div className='space-y-2'>
                    {cleanedIncorrect
                      .filter(
                        (word: string) => !cleanedHighlighted.includes(word)
                      )
                      .map((word: string, idx: number) => (
                        <div
                          key={idx}
                          className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800'
                        >
                          <p className='text-sm text-blue-800 dark:text-blue-200 font-medium'>
                            {word}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Incorrectly Highlighted Words */}
              {response.detailedAnalysis.incorrectHighlights > 0 && (
                <div>
                  <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                    ❌ Incorrectly Highlighted (
                    {response.detailedAnalysis.incorrectHighlights}):
                  </label>
                  <div className='space-y-2'>
                    {cleanedHighlighted
                      .filter(
                        (word: string) => !cleanedIncorrect.includes(word)
                      )
                      .map((word: string, idx: number) => (
                        <div
                          key={idx}
                          className='p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800'
                        >
                          <p className='text-sm text-orange-800 dark:text-orange-200 font-medium'>
                            {word}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className='p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600'>
                <p className='text-sm text-gray-700 dark:text-gray-300'>
                  You correctly identified{' '}
                  <span className='font-semibold text-red-600 dark:text-red-400'>
                    {response.detailedAnalysis.correctHighlights}
                  </span>{' '}
                  out of{' '}
                  <span className='font-semibold'>
                    {response.detailedAnalysis.totalIncorrectWords}
                  </span>{' '}
                  incorrect words.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderEvaluationResponse = () => {
    if (
      questionType === 'DESCRIBE_IMAGE' ||
      questionType === 'SUMMARIZE_WRITTEN_TEXT'
    ) {
      return (
        response.detailedAnalysis.feedback.summary && (
          <div className='bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
            <h5 className='font-medium text-gray-900 dark:text-white mb-2'>
              Summary
            </h5>
            <p className='text-sm text-gray-700 dark:text-gray-300'>
              {response.detailedAnalysis.feedback.summary}
            </p>
          </div>
        )
      );
    }
  };

  const renderHighlightedText = (text: string, errorAnalysis: any) => {
    if (!text || !errorAnalysis) return <span>{text}</span>;

    const allErrors = [
      // Writing question errors
      ...(errorAnalysis.grammarErrors || []).map((error: any) => ({
        ...error,
        type:
          error.type === 'unnecessary_word' ? 'unnecessary_word' : 'grammar',
      })),
      ...(errorAnalysis.spellingErrors || []).map((error: any) => ({
        ...error,
        type: error.type === 'spelling_error' ? 'spelling_error' : 'spelling',
      })),
      ...(errorAnalysis.vocabularyIssues || []).map((error: any) => ({
        ...error,
        type: error.type === 'missing_word' ? 'missing_word' : 'vocabulary',
      })),
      // Speaking question errors
      ...(errorAnalysis.pronunciationErrors || []).map((error: any) => ({
        ...error,
        type: 'pronunciation',
      })),
      ...(errorAnalysis.fluencyErrors || []).map((error: any) => ({
        ...error,
        type: 'fluency',
      })),
      ...(errorAnalysis.contentErrors || []).map((error: any) => ({
        ...error,
        type: 'content',
      })),
    ];

    // Convert text to lowercase for matching but keep original for display
    const lowerText = text.toLowerCase();
    const result: React.ReactNode[] = [];

    // Sort errors by position in text (longest first to avoid partial matches)
    const sortedErrors = [...allErrors].sort((a, b) => {
      const aPos = lowerText.indexOf(a.text.toLowerCase());
      const bPos = lowerText.indexOf(b.text.toLowerCase());
      return b.text.length - a.text.length || aPos - bPos;
    });

    // Create a map of error positions
    const errorPositions: Array<{
      start: number;
      end: number;
      error: any;
    }> = [];

    sortedErrors.forEach((error) => {
      const errorTextLower = error.text
        .toLowerCase()
        .replace(/[.,!?;:"'()]/g, '');
      let searchStart = 0;
      let pos = -1;

      // Find all occurrences of this error in the text
      while ((pos = lowerText.indexOf(errorTextLower, searchStart)) !== -1) {
        // Check if this position overlaps with existing errors
        const overlaps = errorPositions.some(
          (ep) =>
            (pos >= ep.start && pos < ep.end) ||
            (pos + errorTextLower.length > ep.start && pos < ep.end)
        );

        if (!overlaps) {
          errorPositions.push({
            start: pos,
            end: pos + errorTextLower.length,
            error,
          });
        }
        searchStart = pos + 1;
      }
    });

    // Sort error positions by start index
    errorPositions.sort((a, b) => a.start - b.start);

    // Build the result with highlighted errors
    let currentPos = 0;
    errorPositions.forEach((ep) => {
      // Add text before this error
      if (currentPos < ep.start) {
        result.push(
          <span key={`text-${currentPos}`}>
            {text.substring(currentPos, ep.start)}
          </span>
        );
      }

      // Add highlighted error
      const errorText = text.substring(ep.start, ep.end);
      const colorClass =
        ep.error.type === 'unnecessary_word'
          ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600'
          : ep.error.type === 'spelling' || ep.error.type === 'spelling_error'
          ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600'
          : ep.error.type === 'missing_word' || ep.error.type === 'vocabulary'
          ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-600'
          : ep.error.type === 'grammar'
          ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600'
          : ep.error.type === 'pronunciation'
          ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-600'
          : ep.error.type === 'fluency'
          ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600'
          : ep.error.type === 'content'
          ? 'bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-600'
          : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600';

      result.push(
        <span
          key={`error-${ep.start}`}
          className={`${colorClass} px-1 py-0.5 rounded cursor-pointer hover:shadow-md transition-all duration-200 font-medium`}
          onClick={() => setSelectedError(ep.error)}
          title={`Click to see ${ep.error.type} error details`}
        >
          {errorText}
        </span>
      );

      currentPos = ep.end;
    });

    // Add remaining text
    if (currentPos < text.length) {
      result.push(
        <span key={`text-${currentPos}`}>{text.substring(currentPos)}</span>
      );
    }

    return <span>{result}</span>;
  };

  const renderGeneralErrorAnalysis = () => {
    if (questionType === 'ANSWER_SHORT_QUESTION') return null;
    if (!response.detailedAnalysis) {
      console.log('No detailedAnalysis found in response');
      return null;
    }

    let analysis: any;
    try {
      analysis =
        typeof response.detailedAnalysis === 'string'
          ? JSON.parse(response.detailedAnalysis)
          : response.detailedAnalysis;
    } catch (e) {
      console.error('Error parsing detailedAnalysis:', e);
      return null;
    }

    // Try to get errorAnalysis from multiple possible locations
    let errorAnalysis = analysis.errorAnalysis;

    // If not found, try to construct from individual error arrays
    if (
      !errorAnalysis &&
      (analysis.pronunciationErrors ||
        analysis.fluencyErrors ||
        analysis.contentErrors)
    ) {
      errorAnalysis = {
        pronunciationErrors: analysis.pronunciationErrors || [],
        fluencyErrors: analysis.fluencyErrors || [],
        contentErrors: analysis.contentErrors || [],
        grammarErrors: analysis.grammarErrors || [],
        spellingErrors: analysis.spellingErrors || [],
        vocabularyIssues: analysis.vocabularyIssues || [],
      };
    }

    if (!errorAnalysis) {
      console.log('No errorAnalysis found in analysis');
      return null;
    }

    const {
      grammarErrors = [],
      contentErrors = [],
      pronunciationErrors = [],
      fluencyErrors = [],
      spellingErrors = [],
      vocabularyIssues = [],
    } = errorAnalysis;

    const hasErrors =
      (grammarErrors?.length || 0) > 0 ||
      (contentErrors?.length || 0) > 0 ||
      (spellingErrors?.length || 0) > 0 ||
      (pronunciationErrors?.length || 0) > 0 ||
      (fluencyErrors?.length || 0) > 0 ||
      (vocabularyIssues?.length || 0) > 0;

    // For Write from Dictation, show perfect response message if no errors
    if (!hasErrors && questionType === 'WRITE_FROM_DICTATION') {
      return (
        <div className='mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
          <div className='bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-8 border border-emerald-200 dark:border-emerald-800'>
            <div className='flex flex-col items-center justify-center space-y-4'>
              <div className='text-center space-y-2'>
                <h3 className='text-2xl font-bold text-emerald-700 dark:text-emerald-300'>
                  Perfect!
                </h3>
                <p className='text-sm text-emerald-600 dark:text-emerald-400 max-w-sm'>
                  You typed all the words correctly with no spelling mistakes or
                  extra words. Excellent work!
                </p>
              </div>

              {/* Confidence bar */}
              <div className='w-full mt-6 pt-6 border-t border-emerald-200 dark:border-emerald-800'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider'>
                    Accuracy Score
                  </span>
                  <span className='text-lg font-bold text-emerald-700 dark:text-emerald-300'>
                    100%
                  </span>
                </div>
                <div className='w-full bg-emerald-200 dark:bg-emerald-900/50 rounded-full h-2 overflow-hidden'>
                  <div className='bg-gradient-to-r from-emerald-500 to-green-500 h-2 w-full rounded-full animate-pulse'></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!hasErrors) {
      console.log('No errors found in errorAnalysis');
      return null;
    }

    const totalErrors =
      (grammarErrors?.length || 0) +
      (contentErrors?.length || 0) +
      (spellingErrors?.length || 0) +
      (pronunciationErrors?.length || 0) +
      (fluencyErrors?.length || 0) +
      (vocabularyIssues?.length || 0);

    // Special rendering for Write from Dictation
    if (questionType === 'WRITE_FROM_DICTATION') {
      return (
        <div className='mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
          <div className='flex items-center justify-between mb-4 px-1'>
            <div className='flex items-center space-x-2'>
              <AlertTriangle className='h-5 w-5 text-orange-500' />
              <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Detailed Analysis
              </h4>
            </div>
            <span className='px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300'>
              {totalErrors} Improvements Identified
            </span>
          </div>

          {/* Your Sentence with Highlighting */}
          <div className='p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6'>
            <div className='mb-3'>
              <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Your Sentence:
              </h5>
            </div>
            <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
              <div className='text-sm leading-relaxed text-gray-800 dark:text-gray-200'>
                {renderHighlightedText(analysis.userText || '', errorAnalysis)}
              </div>
            </div>
          </div>

          {/* Correct Sentence */}
          <div className='p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-6'>
            <div className='mb-3'>
              <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Correct Sentence:
              </h5>
            </div>
            <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800'>
              <p className='text-sm leading-relaxed text-gray-800 dark:text-gray-200'>
                {analysis.correctText || ''}
              </p>
            </div>
          </div>

          {/* Error Categories */}
          <div className='space-y-3'>
            {/* Spelling Errors */}
            {spellingErrors.length > 0 && (
              <div className='mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-200'>
                <button
                  onClick={() =>
                    setExpandedError(
                      expandedError === 'spelling' ? null : 'spelling'
                    )
                  }
                  className='w-full flex items-center justify-between p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20'>
                      <LucideWholeWord className='h-5 w-5 text-blue-500' />
                    </div>
                    <div className='text-left'>
                      <h5 className='text-sm font-semibold text-gray-900 dark:text-white'>
                        Spelling Mistakes
                      </h5>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {spellingErrors.length}{' '}
                        {spellingErrors.length === 1 ? 'issue' : 'issues'} found
                      </p>
                    </div>
                  </div>
                  <div
                    className={`transform transition-transform duration-200 ${
                      expandedError === 'spelling' ? 'rotate-180' : ''
                    }`}
                  >
                    <TrendingUp className='h-4 w-4 text-gray-400' />
                  </div>
                </button>
                {expandedError === 'spelling' && (
                  <div className='border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 space-y-4'>
                    {spellingErrors.map((error: any, idx: number) => (
                      <div
                        key={idx}
                        className='relative bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm pl-4 border-l-4 border-blue-500'
                      >
                        <div className='flex items-start space-x-3 mb-3'>
                          <div className='mt-1 shrink-0'>
                            <XCircle className='h-4 w-4 text-red-500' />
                          </div>
                          <div>
                            <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                              Your text
                            </span>
                            <p className='text-sm text-gray-700 dark:text-gray-300 line-through decoration-red-400/50 decoration-2'>
                              "{error.text}"
                            </p>
                          </div>
                        </div>
                        {error.correction && (
                          <div className='flex items-start space-x-3 mb-3'>
                            <div className='mt-1 shrink-0'>
                              <CheckCircle className='h-4 w-4 text-green-500' />
                            </div>
                            <div>
                              <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                                Correction
                              </span>
                              <p className='text-sm font-medium text-green-700 dark:text-green-400'>
                                "{error.correction}"
                              </p>
                            </div>
                          </div>
                        )}
                        {error.explanation && (
                          <div className='mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-start space-x-2'>
                            <Lightbulb className='h-4 w-4 text-amber-500 shrink-0 mt-0.5' />
                            <p className='text-xs text-gray-600 dark:text-gray-400 leading-relaxed'>
                              {error.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Unnecessary Words (Grammar Errors) */}
            {grammarErrors.filter((e: any) => e.type === 'unnecessary_word')
              .length > 0 && (
              <div className='mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-200'>
                <button
                  onClick={() =>
                    setExpandedError(
                      expandedError === 'unnecessary' ? null : 'unnecessary'
                    )
                  }
                  className='w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='p-2 rounded-lg bg-red-50 dark:bg-red-900/20'>
                      <AlertCircle className='h-5 w-5 text-red-500' />
                    </div>
                    <div className='text-left'>
                      <h5 className='text-sm font-semibold text-gray-900 dark:text-white'>
                        Unnecessary Words
                      </h5>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {
                          grammarErrors.filter(
                            (e: any) => e.type === 'unnecessary_word'
                          ).length
                        }{' '}
                        {grammarErrors.filter(
                          (e: any) => e.type === 'unnecessary_word'
                        ).length === 1
                          ? 'word'
                          : 'words'}{' '}
                        to remove
                      </p>
                    </div>
                  </div>
                  <div
                    className={`transform transition-transform duration-200 ${
                      expandedError === 'unnecessary' ? 'rotate-180' : ''
                    }`}
                  >
                    <TrendingUp className='h-4 w-4 text-gray-400' />
                  </div>
                </button>
                {expandedError === 'unnecessary' && (
                  <div className='border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 space-y-4'>
                    {grammarErrors
                      .filter((e: any) => e.type === 'unnecessary_word')
                      .map((error: any, idx: number) => (
                        <div
                          key={idx}
                          className='relative bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm pl-4 border-l-4 border-red-500'
                        >
                          <div className='flex items-start space-x-3 mb-3'>
                            <div className='mt-1 shrink-0'>
                              <AlertCircle className='h-4 w-4 text-red-500' />
                            </div>
                            <div>
                              <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                                Extra word to remove
                              </span>
                              <p className='text-sm text-gray-700 dark:text-gray-300 font-medium'>
                                "{error.text}"
                              </p>
                            </div>
                          </div>
                          {error.explanation && (
                            <div className='mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-start space-x-2'>
                              <Lightbulb className='h-4 w-4 text-amber-500 shrink-0 mt-0.5' />
                              <p className='text-xs text-gray-600 dark:text-gray-400 leading-relaxed'>
                                {error.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Missing Words (Vocabulary Issues) */}
            {vocabularyIssues.filter((e: any) => e.type === 'missing_word')
              .length > 0 && (
              <div className='mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-200'>
                <button
                  onClick={() =>
                    setExpandedError(
                      expandedError === 'missing' ? null : 'missing'
                    )
                  }
                  className='w-full flex items-center justify-between p-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20'>
                      <Lightbulb className='h-5 w-5 text-purple-500' />
                    </div>
                    <div className='text-left'>
                      <h5 className='text-sm font-semibold text-gray-900 dark:text-white'>
                        Missing Words
                      </h5>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>
                        {
                          vocabularyIssues.filter(
                            (e: any) => e.type === 'missing_word'
                          ).length
                        }{' '}
                        {vocabularyIssues.filter(
                          (e: any) => e.type === 'missing_word'
                        ).length === 1
                          ? 'word'
                          : 'words'}{' '}
                        not included
                      </p>
                    </div>
                  </div>
                  <div
                    className={`transform transition-transform duration-200 ${
                      expandedError === 'missing' ? 'rotate-180' : ''
                    }`}
                  >
                    <TrendingUp className='h-4 w-4 text-gray-400' />
                  </div>
                </button>
                {expandedError === 'missing' && (
                  <div className='border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 space-y-4'>
                    {vocabularyIssues
                      .filter((e: any) => e.type === 'missing_word')
                      .map((error: any, idx: number) => (
                        <div
                          key={idx}
                          className='relative bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm pl-4 border-l-4 border-purple-500'
                        >
                          <div className='flex items-start space-x-3 mb-3'>
                            <div className='mt-1 shrink-0'>
                              <CheckCircle className='h-4 w-4 text-purple-500' />
                            </div>
                            <div>
                              <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                                Missing word
                              </span>
                              <p className='text-sm font-medium text-purple-700 dark:text-purple-400'>
                                "{error.text}"
                              </p>
                            </div>
                          </div>
                          {error.explanation && (
                            <div className='mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-start space-x-2'>
                              <Lightbulb className='h-4 w-4 text-amber-500 shrink-0 mt-0.5' />
                              <p className='text-xs text-gray-600 dark:text-gray-400 leading-relaxed'>
                                {error.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Helper to render a specific category section
    const renderErrorCategory = (
      title: string,
      errors: any[],
      typeKey: string,
      Icon: any,
      colorTheme: 'red' | 'blue' | 'orange' | 'purple'
    ) => {
      if (!errors || errors.length === 0) return null;

      const themes = {
        red: {
          accent: 'border-red-500',
          text: 'text-red-700 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/10',
          icon: 'text-red-500',
          hover: 'hover:bg-red-50 dark:hover:bg-red-900/20',
        },
        blue: {
          accent: 'border-blue-500',
          text: 'text-blue-700 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/10',
          icon: 'text-blue-500',
          hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
        },
        orange: {
          accent: 'border-orange-500',
          text: 'text-orange-700 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-900/10',
          icon: 'text-orange-500',
          hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
        },
        purple: {
          accent: 'border-purple-500',
          text: 'text-purple-700 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-900/10',
          icon: 'text-purple-500',
          hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
        },
      };

      const theme = themes[colorTheme];
      const isExpanded = expandedError === typeKey;

      return (
        <div className='mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-200'>
          {/* Header */}
          <button
            onClick={() => setExpandedError(isExpanded ? null : typeKey)}
            className={`w-full flex items-center justify-between p-4 transition-colors ${theme.hover}`}
          >
            <div className='flex items-center space-x-3'>
              <div className={`p-2 rounded-lg ${theme.bg}`}>
                <Icon className={`h-5 w-5 ${theme.icon}`} />
              </div>
              <div className='text-left'>
                <h5 className='text-sm font-semibold text-gray-900 dark:text-white'>
                  {title}
                </h5>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {errors.length} {errors.length === 1 ? 'issue' : 'issues'}{' '}
                  found
                </p>
              </div>
            </div>
            <div
              className={`transform transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            >
              <TrendingUp className='h-4 w-4 text-gray-400' />
            </div>
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className='border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-4 space-y-4'>
              {errors.map((error: any, idx: number) => (
                <div
                  key={idx}
                  className={`relative bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm pl-4 border-l-4 ${theme.accent}`}
                >
                  {/* Error Text */}
                  <div className='flex items-start space-x-3 mb-3'>
                    <div className='mt-1 shrink-0'>
                      <XCircle className='h-4 w-4 text-red-500' />
                    </div>
                    <div>
                      <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                        Mistake
                      </span>
                      <p className='text-sm text-gray-700 dark:text-gray-300 line-through decoration-red-400/50 decoration-2'>
                        {error.text}
                      </p>
                    </div>
                  </div>

                  {/* Correction */}
                  {error.correction && (
                    <div className='flex items-start space-x-3 mb-3'>
                      <div className='mt-1 shrink-0'>
                        <CheckCircle className='h-4 w-4 text-green-500' />
                      </div>
                      <div>
                        <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                          Correction
                        </span>
                        <p className='text-sm font-medium text-green-700 dark:text-green-400'>
                          {error.correction}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {error.explanation && (
                    <div className='mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-start space-x-2'>
                      <Lightbulb className='h-4 w-4 text-amber-500 shrink-0' />
                      <p className='text-xs text-gray-600 dark:text-gray-400 leading-relaxed'>
                        {error.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className='mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <div className='flex items-center justify-between mb-4 px-1'>
          <div className='flex items-center space-x-2'>
            <AlertTriangle className='h-5 w-5 text-orange-500' />
            <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Detailed Analysis
            </h4>
          </div>
          <span className='px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300'>
            {totalErrors} Improvements Identified
          </span>
        </div>

        <div className='p-6'>
          <div className='mb-3'>
            <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              Transcribed Audio:
            </h5>
          </div>
          <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border'>
            <div className='text-sm leading-relaxed text-gray-800 dark:text-gray-200'>
              {renderHighlightedText(
                response.detailedAnalysis.recognizedText ||
                  response.detailedAnalysis.userText ||
                  '',
                response.detailedAnalysis.errorAnalysis
              )}
            </div>
          </div>
        </div>

        <div className='space-y-1'>
          {renderErrorCategory(
            'Grammar & Structure',
            grammarErrors,
            'grammar',
            BookOpen,
            'red'
          )}
          {renderErrorCategory(
            'Spelling',
            spellingErrors,
            'spelling',
            LucideWholeWord,
            'red'
          )}
          {renderErrorCategory(
            'Content Accuracy',
            contentErrors,
            'content',
            FileText,
            'blue'
          )}
          {renderErrorCategory(
            'Pronunciation',
            pronunciationErrors,
            'pronunciation',
            Mic,
            'purple'
          )}
          {renderErrorCategory(
            'Fluency & Flow',
            fluencyErrors,
            'fluency',
            Activity,
            'orange'
          )}
        </div>
      </div>
    );
  };

  const renderScoringChart = () => {
    const COLORS = [
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // green
      '#ef4444', // red
      '#06b6d4', // cyan
      '#eab308', // yellow
      '#6366f1', // indigo
      '#14b8a6', // teal
      '#f97316', // orange
      '#84cc16', // lime
      '#a855f7', // violet
      '#d946ef', // fuchsia
      '#0ea5e9', // sky blue
    ];

    if (
      questionType === 'ANSWER_SHORT_QUESTION' ||
      questionType === 'DESCRIBE_IMAGE' ||
      questionType === 'READ_ALOUD' ||
      questionType === 'RE_TELL_LECTURE' ||
      questionType === 'REPEAT_SENTENCE' ||
      questionType === 'SUMMARIZE_WRITTEN_TEXT' ||
      questionType === 'SUMMARIZE_GROUP_DISCUSSION' ||
      questionType === 'WRITE_ESSAY' ||
      questionType === 'FILL_IN_THE_BLANKS_DRAG_AND_DROP' ||
      questionType === 'READING_FILL_IN_THE_BLANKS' ||
      questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING' ||
      questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING' ||
      questionType === 'MULTIPLE_CHOICE_SINGLE_ANSWER_READING' ||
      questionType === 'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING' ||
      questionType === 'RE_ORDER_PARAGRAPHS' ||
      questionType === 'HIGHLIGHT_CORRECT_SUMMARY' ||
      questionType === 'HIGHLIGHT_INCORRECT_WORDS' ||
      questionType === 'SUMMARIZE_SPOKEN_TEXT' ||
      questionType === 'WRITE_FROM_DICTATION' ||
      questionType === 'SELECT_MISSING_WORD'
    ) {
      const data = Object.entries(response.detailedAnalysis.scores).map(
        ([name, values]: any) => ({
          name: formatScoringText(name),
          value: values.score,
          max: values.max,
        })
      );

      const showCHart = data.some((item: any) => item.value > 0);

      return (
        <div className='bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800'>
          <div className='flex items-center space-x-2 mb-6'>
            <TrendingUp className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            <h4 className='font-semibold text-gray-900 dark:text-white'>
              Score Breakdown
            </h4>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Pie Chart */}
            {showCHart && (
              <div className='flex justify-center items-center'>
                <ResponsiveContainer
                  width='100%'
                  height={300}
                >
                  <PieChart>
                    <Pie
                      data={data}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, value, max }) =>
                        `${name}: ${value}/${max}`
                      }
                      outerRadius={80}
                      innerRadius={40}
                      fill='#8884d8'
                      dataKey='value'
                      activeShape
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: string, props: any) =>
                        `${value}/${props.payload.max}`
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Component Scores */}
            <div className='space-y-3'>
              {data.map((item, index) => (
                <div
                  key={item.name}
                  className='bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between mb-2'
                >
                  <div className='flex items-center space-x-2'>
                    <div
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: COLORS[index] }}
                    ></div>
                    <span className='font-medium text-gray-900 dark:text-white'>
                      {item.name}
                    </span>
                  </div>
                  <span className='text-lg font-bold text-gray-900 dark:text-white'>
                    {item.value}/{item.max}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
        {/* Background overlay */}
        <div
          className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75'
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className='inline-block w-full max-w-5xl  p-0 my-8  overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-lg border border-gray-200 dark:border-gray-700'>
          {/* Header */}
          <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 dark:bg-gray-750'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Response Analysis
              </h3>
              <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                {formatDate(response.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          <div className='p-6'>
            {/* Content */}
            <div className='space-y-6 overflow-y-auto max-h-[90%]'>
              {/* Scoring Chart */}
              {renderScoringChart()}

              {/* User Response */}
              {renderUserResponse()}

              {/* Correct Answer */}
              {renderCorrectAnswer()}

              {renderEvaluationResponse()}

              {/* Error Analysis */}
              {renderGeneralErrorAnalysis()}

              {/* Detailed Analysis */}
              {/* {renderDetailedAnalysis()} */}
            </div>

            {/* Footer */}
            <div className='flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                onClick={onClose}
                className='px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium'
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {selectedError && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white dark:bg-gray-800 rounded-lg p-4 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-xl'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-2'>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      selectedError.type === 'grammar'
                        ? 'bg-red-500'
                        : selectedError.type === 'spelling'
                        ? 'bg-blue-500'
                        : selectedError.type === 'vocabulary'
                        ? 'bg-purple-500'
                        : selectedError.type === 'pronunciation'
                        ? 'bg-orange-500'
                        : selectedError.type === 'fluency'
                        ? 'bg-yellow-500'
                        : selectedError.type === 'content'
                        ? 'bg-pink-500'
                        : 'bg-gray-500'
                    }`}
                  ></div>
                  <h3 className='text-base font-semibold text-gray-900 dark:text-white capitalize'>
                    {selectedError.type} Error
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedError(null)}
                  className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                >
                  <XCircle className='h-4 w-4' />
                </button>
              </div>

              <div className='space-y-3'>
                <div>
                  <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                    ❌ Your text:
                  </label>
                  <div className='p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800'>
                    <span className='text-red-800 dark:text-red-200 font-medium text-sm'>
                      "{selectedError.text}"
                    </span>
                  </div>
                </div>

                <div>
                  <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                    ✅ Suggested correction:
                  </label>
                  <div className='p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800'>
                    <span className='text-green-800 dark:text-green-200 font-medium text-sm'>
                      "{selectedError.correction}"
                    </span>
                  </div>
                </div>

                <div>
                  <label className='text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block'>
                    💡 Explanation:
                  </label>
                  <div className='p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800'>
                    <span className='text-blue-800 dark:text-blue-200 text-xs leading-relaxed'>
                      {selectedError.explanation}
                    </span>
                  </div>
                </div>
              </div>

              <div className='mt-4 flex justify-end'>
                <button
                  onClick={() => setSelectedError(null)}
                  className='px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm font-medium'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseDetailModal;
