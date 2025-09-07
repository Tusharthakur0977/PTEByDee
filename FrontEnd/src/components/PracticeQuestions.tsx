import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, RotateCcw, X } from 'lucide-react';
import { PteQuestionTypeName } from '../types/pte';
import { PracticeQuestion as PracticeQuestionType } from '../services/portal';
import AudioRecorder from './AudioRecorder';
import AudioPlayer from './AudioPlayer';
import {
  submitPracticeResponse,
  calculateQuestionScore,
} from '../services/practice';

interface PracticeQuestionProps {
  question: PracticeQuestionType;
  onComplete?: (response: any) => void;
  onNext?: () => void;
  className?: string;
}

const PracticeQuestion: React.FC<PracticeQuestionProps> = ({
  question,
  onComplete,
  onNext,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState(question.content.timeLimit || 300);
  const [isCompleted, setIsCompleted] = useState(false);
  const [response, setResponse] = useState<any>({});
  const [preparationTime, setPreparationTime] = useState(
    question.content.preparationTime || 0
  );
  const [isPreparationPhase, setIsPreparationPhase] = useState(
    !!question.content.preparationTime
  );

  // Timer effect
  useEffect(() => {
    if (isPreparationPhase && preparationTime > 0) {
      const timer = setTimeout(
        () => setPreparationTime(preparationTime - 1),
        1000
      );
      return () => clearTimeout(timer);
    } else if (isPreparationPhase && preparationTime === 0) {
      setIsPreparationPhase(false);
      setTimeLeft(
        question.content.recordingTime || question.content.timeLimit || 300
      );
    } else if (!isPreparationPhase && timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isCompleted) {
      handleSubmit();
    }
  }, [
    timeLeft,
    preparationTime,
    isPreparationPhase,
    isCompleted,
    question.content,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    setIsCompleted(true);

    return;
    // Calculate score and correctness
    const { isCorrect, score } = calculateQuestionScore(
      question.type,
      response,
      question.content.correctAnswers ||
        question.content.options?.filter((o) => o.isCorrect).map((o) => o.id)
    );

    // Submit to backend
    submitPracticeResponse({
      questionId: question.id,
      questionType: question.type,
      response,
      timeTaken: (question.content.timeLimit || 300) - timeLeft,
      isCorrect,
      score,
    }).catch((error) => {
      console.error('Failed to submit practice response:', error);
    });

    onComplete?.({ ...response, isCorrect, score });
  };

  const handleReset = () => {
    setIsCompleted(false);
    setResponse({});
    setTimeLeft(question.content.timeLimit || 300);
    setPreparationTime(question.content.preparationTime || 0);
    setIsPreparationPhase(!!question.content.preparationTime);
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case PteQuestionTypeName.READ_ALOUD:
        return (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
              <p className='text-lg leading-relaxed text-gray-900 dark:text-white'>
                {question.content.text}
              </p>
            </div>
            {!isPreparationPhase && (
              <AudioRecorder
                onRecordingComplete={(audioURL) => setResponse({ audioURL })}
                maxDuration={question.content.recordingTime}
              />
            )}
          </div>
        );

      case PteQuestionTypeName.REPEAT_SENTENCE:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen to the sentence'
                autoPlay={!isPreparationPhase}
              />
            </div>
            {!isPreparationPhase && (
              <AudioRecorder
                onRecordingComplete={(audioURL) => setResponse({ audioURL })}
                maxDuration={question.content.recordingTime}
              />
            )}
          </div>
        );

      case PteQuestionTypeName.DESCRIBE_IMAGE:
        return (
          <div className='space-y-6'>
            <div className='flex justify-center'>
              <img
                src={question.content.imageUrl}
                alt='Describe this image'
                className='max-w-full h-auto rounded-lg shadow-lg'
              />
            </div>
            {!isPreparationPhase && (
              <AudioRecorder
                onRecordingComplete={(audioURL) => setResponse({ audioURL })}
                maxDuration={question.content.recordingTime}
              />
            )}
          </div>
        );

      case PteQuestionTypeName.RE_TELL_LECTURE:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen to the lecture'
                autoPlay={!isPreparationPhase}
              />
            </div>
            {!isPreparationPhase && (
              <AudioRecorder
                onRecordingComplete={(audioURL) => setResponse({ audioURL })}
                maxDuration={question.content.recordingTime}
              />
            )}
          </div>
        );

      case PteQuestionTypeName.ANSWER_SHORT_QUESTION:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen to the question'
                autoPlay={!isPreparationPhase}
              />
            </div>
            {!isPreparationPhase && (
              <AudioRecorder
                onRecordingComplete={(audioURL) => setResponse({ audioURL })}
                maxDuration={question.content.recordingTime}
              />
            )}
          </div>
        );

      case PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT:
      case PteQuestionTypeName.WRITE_ESSAY:
        return (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
              <p className='text-base leading-relaxed text-gray-900 dark:text-white'>
                {question.content.text}
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Your Response (
                {response.text?.split(' ').filter((w: string) => w.length > 0)
                  .length || 0}{' '}
                words)
              </label>
              <textarea
                value={response.text || ''}
                onChange={(e) =>
                  setResponse({ ...response, text: e.target.value })
                }
                className='w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                placeholder='Write your response here...'
              />
              {question.content.wordLimit && (
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                  Word limit: {question.content.wordLimit.min}-
                  {question.content.wordLimit.max} words
                </p>
              )}
            </div>
          </div>
        );

      case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING:
      case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING:
        return (
          <div className='space-y-6'>
            {question.content.text && (
              <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
                <p className='text-base leading-relaxed text-gray-900 dark:text-white'>
                  {question.content.text}
                </p>
              </div>
            )}
            {question.content.audioUrl && (
              <div className='text-center'>
                <AudioPlayer
                  src={question.content.audioUrl}
                  title='Listen to the recording'
                />
              </div>
            )}
            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900 dark:text-white text-lg'>
                Choose the correct answer:
              </h4>
              {question.content.options?.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start space-x-4 p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    response.selectedOption === option.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type='radio'
                    name='single-choice'
                    value={option.id}
                    checked={response.selectedOption === option.id}
                    onChange={(e) =>
                      setResponse({
                        ...response,
                        selectedOption: e.target.value,
                      })
                    }
                    className='mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300'
                  />
                  <span className='text-gray-900 dark:text-white leading-relaxed'>
                    {option.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING:
      case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING:
        return (
          <div className='space-y-6'>
            {question.content.text && (
              <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
                <p className='text-base leading-relaxed text-gray-900 dark:text-white'>
                  {question.content.text}
                </p>
              </div>
            )}
            {question.content.audioUrl && (
              <div className='text-center'>
                <AudioPlayer
                  src={question.content.audioUrl}
                  title='Listen to the recording'
                />
              </div>
            )}
            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900 dark:text-white text-lg'>
                Choose all correct answers:
              </h4>
              {question.content.options?.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start space-x-4 p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    response.selectedOptions?.includes(option.id)
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type='checkbox'
                    value={option.id}
                    checked={
                      response.selectedOptions?.includes(option.id) || false
                    }
                    onChange={(e) => {
                      const selectedOptions = response.selectedOptions || [];
                      if (e.target.checked) {
                        setResponse({
                          ...response,
                          selectedOptions: [...selectedOptions, option.id],
                        });
                      } else {
                        setResponse({
                          ...response,
                          selectedOptions: selectedOptions.filter(
                            (id: string) => id !== option.id
                          ),
                        });
                      }
                    }}
                    className='mt-1 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded'
                  />
                  <span className='text-gray-900 dark:text-white leading-relaxed'>
                    {option.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case PteQuestionTypeName.RE_ORDER_PARAGRAPHS:
        return (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              <div>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-4 text-lg'>
                  Available Paragraphs
                </h4>
                <div className='space-y-3 min-h-[300px] p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600'>
                  {question.content.paragraphs
                    ?.filter((p) => !response.orderedParagraphs?.includes(p.id))
                    .map((paragraph) => (
                      <div
                        key={paragraph.id}
                        className='p-4 bg-white dark:bg-gray-800 rounded-lg cursor-move shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600'
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData('text/plain', paragraph.id)
                        }
                      >
                        <p className='text-sm text-gray-900 dark:text-white leading-relaxed'>
                          {paragraph.text}
                        </p>
                      </div>
                    ))}
                  {question.content.paragraphs?.filter(
                    (p) => !response.orderedParagraphs?.includes(p.id)
                  ).length === 0 && (
                    <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400'>
                      <p className='text-center'>
                        All paragraphs have been ordered
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-4 text-lg'>
                  Correct Order
                </h4>
                <div
                  className='min-h-[300px] p-4 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg space-y-3 bg-blue-50 dark:bg-blue-900/20'
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const paragraphId = e.dataTransfer.getData('text/plain');
                    const orderedParagraphs = response.orderedParagraphs || [];
                    setResponse({
                      ...response,
                      orderedParagraphs: [...orderedParagraphs, paragraphId],
                    });
                  }}
                >
                  {response.orderedParagraphs?.length === 0 && (
                    <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400'>
                      <p className='text-center'>
                        Drag paragraphs here in the correct order
                      </p>
                    </div>
                  )}
                  {response.orderedParagraphs?.map(
                    (paragraphId: string, index: number) => {
                      const paragraph = question.content.paragraphs?.find(
                        (p) => p.id === paragraphId
                      );
                      return (
                        <div
                          key={paragraphId}
                          className='p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm'
                        >
                          <div className='flex justify-between items-start gap-3'>
                            <div className='flex items-start space-x-3'>
                              <span className='bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center'>
                                {index + 1}
                              </span>
                              <p className='text-sm text-gray-900 dark:text-white leading-relaxed'>
                                {paragraph?.text}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const orderedParagraphs =
                                  response.orderedParagraphs.filter(
                                    (id: string) => id !== paragraphId
                                  );
                                setResponse({ ...response, orderedParagraphs });
                              }}
                              className='text-red-600 hover:text-red-800 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors'
                            >
                              <X className='w-4 h-4' />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case PteQuestionTypeName.READING_FILL_IN_THE_BLANKS:
        return (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
              <h4 className='font-medium text-gray-900 dark:text-white mb-4 text-lg'>
                Click on each blank to select the correct word:
              </h4>
              <div className='text-lg leading-relaxed'>
                {question.content.text
                  ?.split('_____')
                  .map((part, index, array) => (
                    <span key={index}>
                      {part}
                      {index < array.length - 1 && (
                        <select
                          value={response.blanks?.[`blank${index + 1}`] || ''}
                          onChange={(e) =>
                            setResponse({
                              ...response,
                              blanks: {
                                ...response.blanks,
                                [`blank${index + 1}`]: e.target.value,
                              },
                            })
                          }
                          className='mx-2 px-3 py-2 border-2 border-green-300 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white min-w-[120px] focus:ring-2 focus:ring-green-500 focus:border-green-500'
                        >
                          <option value=''>Select...</option>
                          {question.content.blanks?.[index]?.options.map(
                            (option) => (
                              <option
                                key={option}
                                value={option}
                              >
                                {option}
                              </option>
                            )
                          )}
                        </select>
                      )}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        );

      case PteQuestionTypeName.READING_WRITING_FILL_IN_THE_BLANKS:
        return (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
              <div className='text-base leading-relaxed text-gray-900 dark:text-white'>
                {question.content.text
                  ?.split('_____')
                  .map((part, index, array) => (
                    <span key={index}>
                      {part}
                      {index < array.length - 1 && (
                        <select
                          value={response.blanks?.[`blank${index + 1}`] || ''}
                          onChange={(e) =>
                            setResponse({
                              ...response,
                              blanks: {
                                ...response.blanks,
                                [`blank${index + 1}`]: e.target.value,
                              },
                            })
                          }
                          className='mx-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[120px]'
                        >
                          <option value=''>Select...</option>
                          {question.content.blanks?.[index]?.options.map(
                            (option) => (
                              <option
                                key={option}
                                value={option}
                              >
                                {option}
                              </option>
                            )
                          )}
                        </select>
                      )}
                    </span>
                  ))}
              </div>
            </div>

            {/* Available words for drag and drop */}
            <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
              <h4 className='font-medium text-gray-900 dark:text-white mb-3'>
                Available Words
              </h4>
              <div className='flex flex-wrap gap-2'>
                {question.content.blanks
                  ?.flatMap((blank) => blank.options)
                  .map((word, index) => (
                    <span
                      key={index}
                      className='px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-sm cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors'
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData('text/plain', word)
                      }
                    >
                      {word}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        );

      case PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen and fill in the blanks'
              />
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
              <h4 className='font-medium text-gray-900 dark:text-white mb-4 text-lg'>
                Type the missing words:
              </h4>
              <div className='text-lg leading-relaxed'>
                {question.content.text
                  ?.split('_____')
                  .map((part, index, array) => (
                    <span key={index}>
                      {part}
                      {index < array.length - 1 && (
                        <input
                          type='text'
                          value={response.blanks?.[`blank${index + 1}`] || ''}
                          onChange={(e) =>
                            setResponse({
                              ...response,
                              blanks: {
                                ...response.blanks,
                                [`blank${index + 1}`]: e.target.value,
                              },
                            })
                          }
                          className='mx-2 px-3 py-2 border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white min-w-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          placeholder='...'
                        />
                      )}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        );

      case PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen to the lecture'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Your Summary (
                {response.text?.split(' ').filter((w: string) => w.length > 0)
                  .length || 0}{' '}
                words)
              </label>
              <textarea
                value={response.text || ''}
                onChange={(e) =>
                  setResponse({ ...response, text: e.target.value })
                }
                className='w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                placeholder='Write your summary here...'
              />
              {question.content.wordLimit && (
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                  Word limit: {question.content.wordLimit.min}-
                  {question.content.wordLimit.max} words
                </p>
              )}
            </div>
          </div>
        );

      case PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen to the recording'
              />
            </div>
            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900 dark:text-white text-lg'>
                Choose the best summary:
              </h4>
              {question.content.options?.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start space-x-4 p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    response.selectedSummary === option.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type='radio'
                    name='summary-choice'
                    value={option.id}
                    checked={response.selectedSummary === option.id}
                    onChange={(e) =>
                      setResponse({
                        ...response,
                        selectedSummary: e.target.value,
                      })
                    }
                    className='mt-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300'
                  />
                  <div className='flex-1'>
                    <p className='text-gray-900 dark:text-white leading-relaxed'>
                      {option.text}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case PteQuestionTypeName.SELECT_MISSING_WORD:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen and select the missing word'
              />
            </div>
            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900 dark:text-white text-lg text-center'>
                Select the missing word:
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {question.content.options?.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      setResponse({ ...response, selectedWord: option.id })
                    }
                    className={`p-6 border-2 rounded-xl text-center transition-all duration-200 font-medium ${
                      response.selectedWord === option.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen and highlight incorrect words'
              />
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
              <h4 className='font-medium text-gray-900 dark:text-white mb-4 text-lg'>
                Click on words that are different from what you heard:
              </h4>
              <div className='text-lg leading-relaxed'>
                {question.content.text
                  ?.split(' ')
                  .map((word, index) => (
                    <span
                      key={index}
                      onClick={() => {
                        const highlightedWords =
                          response.highlightedWords || [];
                        if (highlightedWords.includes(word)) {
                          setResponse({
                            ...response,
                            highlightedWords: highlightedWords.filter(
                              (w: string) => w !== word
                            ),
                          });
                        } else {
                          setResponse({
                            ...response,
                            highlightedWords: [...highlightedWords, word],
                          });
                        }
                      }}
                      className={`cursor-pointer px-2 py-1 mx-1 rounded-md transition-all duration-200 ${
                        response.highlightedWords?.includes(word)
                          ? 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300 shadow-sm'
                          : 'text-gray-900 dark:text-white hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                      }`}
                    >
                      {word}
                    </span>
                  ))
                  .reduce((prev, curr, index) => (
                    <React.Fragment key={index}>
                      {prev} {curr}
                    </React.Fragment>
                  ))}
              </div>
              <div className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
                Selected words: {response.highlightedWords?.length || 0}
              </div>
            </div>
          </div>
        );

      case PteQuestionTypeName.WRITE_FROM_DICTATION:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen and type the sentence'
              />
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-200 dark:border-gray-600'>
              <label className='block text-lg font-medium text-gray-700 dark:text-gray-300 mb-4'>
                Type exactly what you hear:
              </label>
              <input
                type='text'
                value={response.text || ''}
                onChange={(e) =>
                  setResponse({ ...response, text: e.target.value })
                }
                className='w-full p-4 text-lg border-2 border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white'
                placeholder='Type the sentence here...'
              />
              <div className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                Words typed:{' '}
                {response.text?.split(' ').filter((w: string) => w.length > 0)
                  .length || 0}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className='text-center py-8'>
            <p className='text-gray-600 dark:text-gray-300'>
              Question type not implemented yet.
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            {question.title}
          </h2>
          <p className='text-sm font-medium text-gray-600 dark:text-gray-400 mt-2 uppercase tracking-wide'>
            {question.type
              .replace(/_/g, ' ')
              .toLowerCase()
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </p>
        </div>
        <div className='flex items-center space-x-6'>
          {isPreparationPhase ? (
            <div className='flex items-center space-x-3 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg border border-orange-200 dark:border-orange-800'>
              <Clock className='h-5 w-5 text-orange-600 dark:text-orange-400' />
              <div>
                <div className='text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide'>
                  Preparation
                </div>
                <div className='font-mono text-lg font-bold text-orange-700 dark:text-orange-300'>
                  {formatTime(preparationTime)}
                </div>
              </div>
            </div>
          ) : (
            <div className='flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800'>
              <Clock className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              <div>
                <div className='text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide'>
                  Time Left
                </div>
                <div className='font-mono text-lg font-bold text-blue-700 dark:text-blue-300'>
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>
          )}
          {isCompleted && (
            <div className='flex items-center space-x-3 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800'>
              <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
              <span className='text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wide'>
                Completed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl mb-8 border border-blue-200 dark:border-blue-800'>
        <div className='flex items-start space-x-4'>
          <div className='bg-blue-600 p-2 rounded-lg'>
            <AlertCircle className='h-5 w-5 text-white' />
          </div>
          <div>
            <h3 className='font-bold text-blue-900 dark:text-blue-100 mb-3 text-lg'>
              Instructions
            </h3>
            <p className='text-blue-800 dark:text-blue-200 leading-relaxed'>
              {question.instructions}
            </p>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className='mb-8'>{renderQuestionContent()}</div>

      {/* Actions */}
      <div className='flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700'>
        <button
          onClick={handleReset}
          className='flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200'
        >
          <RotateCcw className='h-4 w-4' />
          <span className='font-medium'>Reset</span>
        </button>

        <div className='flex space-x-4'>
          {!isCompleted && !isPreparationPhase && (
            <button
              onClick={handleSubmit}
              className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl'
            >
              Submit
            </button>
          )}
          {isCompleted && onNext && (
            <button
              onClick={onNext}
              className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl'
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeQuestion;
