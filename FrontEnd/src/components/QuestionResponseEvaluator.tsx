import { Info, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { PteQuestionTypeName } from '../types/pte';

interface QuestionEvaluation {
  score: number;
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: any;
  suggestions: string[];
}

interface QuestionResponseEvaluatorProps {
  evaluation: QuestionEvaluation;
  questionType: PteQuestionTypeName;
  transcribedText?: string;
  className?: string;
  question?: any;
}

const QuestionResponseEvaluator: React.FC<QuestionResponseEvaluatorProps> = ({
  evaluation,
  questionType,
  transcribedText,
  className = '',
  question,
}) => {
  const [selectedError, setSelectedError] = useState<any>(null);

  // Parse detailedAnalysis if it's a string
  const parsedDetailedAnalysis = (() => {
    let { detailedAnalysis } = evaluation;
    if (typeof detailedAnalysis === 'string') {
      try {
        detailedAnalysis = JSON.parse(detailedAnalysis);
      } catch (e) {
        console.error('Failed to parse detailedAnalysis:', e);
        detailedAnalysis = null;
      }
    }
    return detailedAnalysis;
  })();

  // Create a modified evaluation object with parsed detailedAnalysis
  const evaluationWithParsedAnalysis = {
    ...evaluation,
    detailedAnalysis: parsedDetailedAnalysis,
  };

  // Helper function to get score color
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Helper function to get accuracy level
  const getAccuracyLevel = (score: number, maxScore?: number) => {
    // If score is likely a percentage (>100 or no maxScore), use percentage thresholds
    if (score > 100 || !maxScore) {
      if (score >= 85) return { label: 'Accurate', color: 'text-green-600' };
      if (score >= 65)
        return { label: 'Score accurate?', color: 'text-blue-600' };
      if (score >= 40) return { label: 'Too high', color: 'text-orange-600' };
      return { label: 'Too low', color: 'text-red-600' };
    }

    // For actual point scores, calculate percentage
    const percentage = (score / maxScore) * 100;
    if (percentage >= 85) return { label: 'Accurate', color: 'text-green-600' };
    if (percentage >= 65)
      return { label: 'Score accurate?', color: 'text-blue-600' };
    if (percentage >= 40)
      return { label: 'Too high', color: 'text-orange-600' };
    return { label: 'Too low', color: 'text-red-600' };
  };

  // Get scoring criteria for each question type
  const getScoringCriteria = (questionType: string) => {
    const criteriaMap: { [key: string]: string[] } = {
      // Speaking Questions
      READ_ALOUD: ['Content', 'Oral Fluency', 'Pronunciation'],
      REPEAT_SENTENCE: ['Content', 'Oral Fluency', 'Pronunciation'],
      DESCRIBE_IMAGE: ['Content', 'Oral Fluency', 'Pronunciation'],
      RE_TELL_LECTURE: ['Content', 'Oral Fluency', 'Pronunciation'],
      ANSWER_SHORT_QUESTION: ['Vocabulary'],

      // Writing Questions
      SUMMARIZE_WRITTEN_TEXT: [
        'Content',
        'Form',
        'Grammar',
        'Vocabulary',
        'Spelling',
      ],
      WRITE_ESSAY: [
        'Content',
        'Form',
        'Development Structure Coherence',
        'Grammar',
        'General Linguistic Range',
        'Vocabulary Range',
        'Spelling',
      ],
      SUMMARIZE_SPOKEN_TEXT: [
        'Content',
        'Form',
        'Grammar',
        'Vocabulary',
        'Spelling',
      ],

      // Reading Questions
      MULTIPLE_CHOICE_SINGLE_ANSWER_READING: ['Reading'],
      MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING: ['Reading'],
      RE_ORDER_PARAGRAPHS: ['Reading'],
      READING_FILL_IN_THE_BLANKS: ['Reading'],
      FILL_IN_THE_BLANKS_DRAG_AND_DROP: ['Reading'],

      // Listening Questions
      MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING: ['Listening'],
      MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING: ['Listening'],
      LISTENING_FILL_IN_THE_BLANKS: ['Listening'],
      HIGHLIGHT_CORRECT_SUMMARY: ['Listening'],
      SELECT_MISSING_WORD: ['Listening'],
      HIGHLIGHT_INCORRECT_WORDS: ['Listening'],
      WRITE_FROM_DICTATION: ['Listening'],
    };

    return criteriaMap[questionType] || ['Overall Performance'];
  };

  // Function to render scoring table based on question type
  const renderScoringTable = () => {
    const { detailedAnalysis } = evaluationWithParsedAnalysis;

    // For ANSWER_SHORT_QUESTION - show only vocabulary score
    if (questionType === 'ANSWER_SHORT_QUESTION' && detailedAnalysis?.scores) {
      const scores = detailedAnalysis.scores;
      const vocabularyScore = scores.vocabulary;

      return (
        <div className='space-y-4'>
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-50 dark:bg-gray-700'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                    Scoring Rubric
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                <tr className='hover:bg-gray-50 dark:hover:bg-gray-700'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <span className='text-sm font-medium text-gray-900 dark:text-white capitalize'>
                        Vocabulary
                      </span>
                      <Info className='ml-2 h-4 w-4 text-gray-400 cursor-help' />
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`text-sm font-semibold ${getScoreColor(
                        vocabularyScore.score,
                        vocabularyScore.max
                      )}`}
                    >
                      {vocabularyScore.score}/{vocabularyScore.max}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (
      (questionType === 'DESCRIBE_IMAGE' ||
        questionType === 'RE_TELL_LECTURE' ||
        questionType === 'SUMMARIZE_GROUP_DISCUSSION' ||
        questionType === 'RESPOND_TO_A_SITUATION' ||
        questionType === 'REPEAT_SENTENCE' ||
        questionType === 'READ_ALOUD' ||
        questionType === 'SUMMARIZE_SPOKEN_TEXT' ||
        questionType === 'SUMMARIZE_WRITTEN_TEXT' ||
        questionType === 'WRITE_ESSAY' ||
        questionType === 'MULTIPLE_CHOICE_SINGLE_ANSWER_READING' ||
        questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING' ||
        questionType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING' ||
        questionType === 'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING' ||
        questionType === 'RE_ORDER_PARAGRAPHS' ||
        questionType === 'READING_FILL_IN_THE_BLANKS' ||
        questionType === 'FILL_IN_THE_BLANKS_DRAG_AND_DROP' ||
        questionType === 'HIGHLIGHT_CORRECT_SUMMARY' ||
        questionType === 'SELECT_MISSING_WORD' ||
        questionType === 'HIGHLIGHT_INCORRECT_WORDS') &&
      detailedAnalysis?.scores
    ) {
      const scores = detailedAnalysis.scores;
      const feedback = detailedAnalysis.feedback || {};

      return (
        <div className='space-y-4'>
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-50 dark:bg-gray-700'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                    Scoring Rubric
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                    Score
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                {Object.entries(scores).map(
                  ([component, scoreData]: [string, any]) => (
                    <tr
                      key={component}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <span className='text-sm font-medium text-gray-900 dark:text-white capitalize'>
                            {component === 'oralFluency'
                              ? 'Oral Fluency'
                              : component}
                          </span>
                          <Info className='ml-2 h-4 w-4 text-gray-400 cursor-help' />
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`text-sm font-semibold ${getScoreColor(
                            scoreData.score,
                            scoreData.max
                          )}`}
                        >
                          {scoreData.score}/{scoreData.max}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <span className='text-sm text-gray-600 dark:text-gray-300'>
                          {feedback[component] ||
                            'No specific feedback available'}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Reading Question Details */}
          {renderReadingQuestionDetails(
            questionType,
            detailedAnalysis,
            evaluationWithParsedAnalysis.isCorrect,
            question
          )}
        </div>
      );
    }

    // For WRITE_FROM_DICTATION - show detailed comparison with correct and user sentences
    if (questionType === 'WRITE_FROM_DICTATION' && detailedAnalysis?.scores) {
      const scores = detailedAnalysis.scores;
      const correctText = detailedAnalysis.correctText || '';
      const userText = detailedAnalysis.userText || '';
      const correctWordCount = detailedAnalysis.correctWordCount || 0;
      const totalWords = detailedAnalysis.totalWords || 0;
      const accuracy = detailedAnalysis.accuracy || 0;

      return (
        <div className='space-y-4'>
          {/* Scoring Table */}
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-50 dark:bg-gray-700'>
                <tr>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                    Scoring Rubric
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                    Score
                  </th>
                  <th className='px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white'>
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                {Object.entries(scores).map(
                  ([component, scoreData]: [string, any]) => (
                    <tr
                      key={component}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <span className='text-sm font-medium text-gray-900 dark:text-white capitalize'>
                            {component}
                          </span>
                          <Info className='ml-2 h-4 w-4 text-gray-400 cursor-help' />
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`text-sm font-semibold ${getScoreColor(
                            scoreData.score,
                            scoreData.max
                          )}`}
                        >
                          {scoreData.score}/{scoreData.max}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <span className='text-sm text-gray-600 dark:text-gray-300'>
                          {correctWordCount} out of {totalWords} words correct (
                          {accuracy.toFixed(1)}%)
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Correct Sentence */}
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-3'>
              Correct Sentence
            </h4>
            <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800'>
              <p className='text-sm text-gray-800 dark:text-gray-200 leading-relaxed'>
                {correctText}
              </p>
            </div>
          </div>

          {/* User's Sentence */}
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-3'>
              Your Sentence
            </h4>
            <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800'>
              <p className='text-sm text-gray-800 dark:text-gray-200 leading-relaxed'>
                {renderHighlightedText(
                  userText,
                  evaluationWithParsedAnalysis.detailedAnalysis.errorAnalysis
                )}
              </p>
            </div>
          </div>

          {/* Error Analysis Section */}
          {evaluationWithParsedAnalysis.detailedAnalysis?.errorAnalysis && (
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
              {(() => {
                const errorAnalysis =
                  evaluationWithParsedAnalysis.detailedAnalysis.errorAnalysis;
                const hasErrors =
                  (errorAnalysis.grammarErrors &&
                    errorAnalysis.grammarErrors.length > 0) ||
                  (errorAnalysis.spellingErrors &&
                    errorAnalysis.spellingErrors.length > 0) ||
                  (errorAnalysis.vocabularyIssues &&
                    errorAnalysis.vocabularyIssues.length > 0);

                if (!hasErrors) {
                  return (
                    <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
                      <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                        Error Analysis
                      </h4>
                      <div className='flex items-center space-x-2'>
                        <div className='w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'>
                          <svg
                            className='w-2.5 h-2.5 text-white'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </div>
                        <span className='text-green-700 dark:text-green-300 font-medium'>
                          Perfect! No errors detected
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
                      <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                        Error Analysis
                      </h4>
                      <div className='flex flex-wrap items-center gap-4 text-sm'>
                        <div className='flex items-center space-x-2'>
                          <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Grammar
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Spelling
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <div className='w-3 h-3 bg-purple-500 rounded-full'></div>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Vocabulary
                          </span>
                        </div>
                        <span className='text-gray-500 dark:text-gray-400 text-xs'>
                          * Click colored words for explanation
                        </span>
                      </div>
                    </div>

                    <div className='p-6'>
                      <div className='mb-6'>
                        <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                          Correct Text:
                        </h5>
                        <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800'>
                          <p className='text-sm text-gray-800 dark:text-gray-200 leading-relaxed'>
                            {correctText}
                          </p>
                        </div>
                      </div>

                      <div className='mb-3'>
                        <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                          Mistakes Found:
                        </h5>
                      </div>
                      <div className='space-y-3'>
                        {errorAnalysis.grammarErrors &&
                          errorAnalysis.grammarErrors.length > 0 && (
                            <div className='bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800'>
                              <p className='text-xs font-semibold text-red-700 dark:text-red-300 mb-2'>
                                Grammar Errors (
                                {errorAnalysis.grammarErrors.length})
                              </p>
                              <ul className='space-y-1'>
                                {errorAnalysis.grammarErrors.map(
                                  (error: any, idx: number) => (
                                    <li
                                      key={idx}
                                      className='text-xs text-red-600 dark:text-red-400'
                                    >
                                      • {error.text} → {error.correction}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {errorAnalysis.spellingErrors &&
                          errorAnalysis.spellingErrors.length > 0 && (
                            <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800'>
                              <p className='text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2'>
                                Spelling Errors (
                                {errorAnalysis.spellingErrors.length})
                              </p>
                              <ul className='space-y-1'>
                                {errorAnalysis.spellingErrors.map(
                                  (error: any, idx: number) => (
                                    <li
                                      key={idx}
                                      className='text-xs text-blue-600 dark:text-blue-400'
                                    >
                                      • {error.text} → {error.correction}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {errorAnalysis.vocabularyIssues &&
                          errorAnalysis.vocabularyIssues.length > 0 && (
                            <div className='bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800'>
                              <p className='text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2'>
                                Vocabulary Issues (
                                {errorAnalysis.vocabularyIssues.length})
                              </p>
                              <ul className='space-y-1'>
                                {errorAnalysis.vocabularyIssues.map(
                                  (error: any, idx: number) => (
                                    <li
                                      key={idx}
                                      className='text-xs text-purple-600 dark:text-purple-400'
                                    >
                                      • {error.text} → {error.correction}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      );
    }

    // For SUMMARIZE_SPOKEN_TEXT and WRITE_ESSAY with structured scores (but not WRITE_FROM_DICTATION)
    if (
      detailedAnalysis?.scores &&
      typeof detailedAnalysis.scores === 'object' &&
      questionType !== 'WRITE_FROM_DICTATION'
    ) {
      const scores = detailedAnalysis.scores;
      const feedback = detailedAnalysis.feedback || {};

      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-gray-50 dark:bg-gray-700'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Component
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Score
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Suggestion
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
              {Object.entries(scores).map(
                ([component, scoreData]: [string, any]) => (
                  <tr
                    key={component}
                    className='hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <span className='text-sm font-medium text-gray-900 dark:text-white capitalize'>
                          {component.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <Info className='ml-2 h-4 w-4 text-gray-400 cursor-help' />
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`text-sm font-semibold ${getScoreColor(
                          scoreData.score,
                          scoreData.max
                        )}`}
                      >
                        {scoreData.score}/{scoreData.max}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-600 dark:text-gray-300'>
                        {feedback[component] ||
                          'No specific feedback available'}
                      </span>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      );
    }

    // For SUMMARIZE_WRITTEN_TEXT with individual score properties (legacy format)
    if (
      detailedAnalysis?.contentScore !== undefined &&
      detailedAnalysis?.maxContentScore !== undefined
    ) {
      const components = [];
      const feedback = detailedAnalysis.feedback || {};

      // Content score
      if (detailedAnalysis.contentScore !== undefined) {
        components.push({
          name: 'Content',
          score: detailedAnalysis.contentScore,
          max: detailedAnalysis.maxContentScore || 4,
          suggestion:
            feedback.content || 'Focus on capturing main ideas and key details',
        });
      }

      // Form score
      if (detailedAnalysis.formScore !== undefined) {
        components.push({
          name: 'Form',
          score: detailedAnalysis.formScore,
          max: detailedAnalysis.maxFormScore || 1,
          suggestion:
            feedback.form || 'Write as a single sentence within word limits',
        });
      }

      // Grammar score
      if (detailedAnalysis.grammarScore !== undefined) {
        components.push({
          name: 'Grammar',
          score: detailedAnalysis.grammarScore,
          max: detailedAnalysis.maxGrammarScore || 2,
          suggestion:
            feedback.grammar || 'Review grammatical structures and accuracy',
        });
      }

      // Vocabulary score
      if (detailedAnalysis.vocabularyScore !== undefined) {
        components.push({
          name: 'Vocabulary',
          score: detailedAnalysis.vocabularyScore,
          max: detailedAnalysis.maxVocabularyScore || 2,
          suggestion:
            feedback.vocabulary || 'Use appropriate and varied vocabulary',
        });
      }

      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-gray-50 dark:bg-gray-700'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Component
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Score
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Suggestion
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
              {components.map((component, index) => (
                <tr
                  key={index}
                  className='hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <span className='text-sm font-medium text-gray-900 dark:text-white'>
                        {component.name}
                      </span>
                      <Info className='ml-2 h-4 w-4 text-gray-400 cursor-help' />
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`text-sm font-semibold ${getScoreColor(
                        component.score,
                        component.max
                      )}`}
                    >
                      {component.score}/{component.max}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <span className='text-sm text-gray-600 dark:text-gray-300'>
                      {component.suggestion}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // For other question types with different structures
    return renderAlternativeScoring();
  };

  // Alternative scoring display for other question types
  const renderAlternativeScoring = () => {
    const { detailedAnalysis } = evaluation;

    // For audio-based questions (READ_ALOUD, REPEAT_SENTENCE, etc.)
    if (
      detailedAnalysis?.contentScore !== undefined ||
      detailedAnalysis?.pronunciationScore !== undefined
    ) {
      const components = [];

      if (detailedAnalysis.contentScore !== undefined) {
        components.push({
          name: 'Content',
          score: detailedAnalysis.contentScore,
          max: detailedAnalysis.contentMaxScore || 5,
          suggestion: 'Focus on accuracy and completeness of content',
        });
      }

      if (detailedAnalysis.pronunciationScore !== undefined) {
        components.push({
          name: 'Pronunciation',
          score: detailedAnalysis.pronunciationScore,
          max: detailedAnalysis.pronunciationMaxScore || 5,
          suggestion: 'Work on clear articulation and stress patterns',
        });
      }

      if (
        detailedAnalysis.fluencyScore !== undefined ||
        detailedAnalysis.oralFluencyScore !== undefined
      ) {
        components.push({
          name: 'Oral Fluency',
          score:
            detailedAnalysis.fluencyScore || detailedAnalysis.oralFluencyScore,
          max:
            detailedAnalysis.fluencyMaxScore ||
            detailedAnalysis.oralFluencyMaxScore ||
            5,
          suggestion: 'Practice smooth, natural speech rhythm',
        });
      }

      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-gray-50 dark:bg-gray-700'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Component
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Score
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Suggestion
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
              {components.map((component, index) => (
                <tr
                  key={index}
                  className='hover:bg-gray-50 dark:hover:bg-gray-700'
                >
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <span className='text-sm font-medium text-gray-900 dark:text-white'>
                        {component.name}
                      </span>
                      <Info className='ml-2 h-4 w-4 text-gray-400 cursor-help' />
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`text-sm font-semibold ${getScoreColor(
                        component.score,
                        component.max
                      )}`}
                    >
                      {component.score}/{component.max}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <span className='text-sm text-gray-600 dark:text-gray-300'>
                      {component.suggestion}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Handle standardized format
    if (isStandardizedFormat) {
      const scoring = evaluationWithParsedAnalysis.detailedAnalysis.scoring;

      // For item-based questions (fill-in-the-blanks, MCQ, etc.)
      if (scoring.itemAnalysis) {
        return (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                {scoring.itemAnalysis.correctItems}/
                {scoring.itemAnalysis.totalItems}
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                {evaluationWithParsedAnalysis.isCorrect
                  ? 'Passed'
                  : 'Not Passed'}
              </div>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                Accuracy: {scoring.itemAnalysis.accuracy}%
              </div>
            </div>
          </div>
        );
      }

      // For component-based questions (audio, writing, etc.)
      if (scoring.components) {
        return (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                {scoring.overall.score}/{scoring.overall.maxScore}
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                {evaluationWithParsedAnalysis.isCorrect
                  ? 'Passed'
                  : 'Not Passed'}
              </div>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                Score: {scoring.overall.percentage}%
              </div>
            </div>
          </div>
        );
      }
    }

    // For simple scoring (multiple choice, etc.) - legacy format
    const scoringCriteria = getScoringCriteria(questionType);
    if (isCorrectTotalFormatQuestion) return;
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
        <div className='text-center'>
          <div className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            {evaluationWithParsedAnalysis.score > 100
              ? `${evaluationWithParsedAnalysis.score}%`
              : evaluationWithParsedAnalysis.score}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
            {evaluationWithParsedAnalysis.isCorrect
              ? 'Correct Answer'
              : 'Incorrect Answer'}
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>
            Evaluated on: {scoringCriteria.join(' + ')}
          </div>
        </div>
      </div>
    );
  };

  const isAudioBasedQuestion = [
    'READ_ALOUD',
    'REPEAT_SENTENCE',
    'DESCRIBE_IMAGE',
    'RE_TELL_LECTURE',
    'ANSWER_SHORT_QUESTION',
    'SUMMARIZE_GROUP_DISCUSSION',
    'RESPOND_TO_A_SITUATION',
  ].includes(questionType);

  const isFillInTheBlanksQuestion = questionType.includes('FILL_IN_THE_BLANKS');
  const isMultipleChoiceMultipleQuestion = questionType.includes(
    'MULTIPLE_CHOICE_MULTIPLE_ANSWERS'
  );
  const isReorderParagraphsQuestion = questionType === 'RE_ORDER_PARAGRAPHS';
  const isHighlightIncorrectWordsQuestion =
    questionType === 'HIGHLIGHT_INCORRECT_WORDS';
  const isWriteFromDictationQuestion = questionType === 'WRITE_FROM_DICTATION';

  // Questions that use correct/total format
  const isCorrectTotalFormatQuestion =
    isFillInTheBlanksQuestion ||
    isMultipleChoiceMultipleQuestion ||
    isReorderParagraphsQuestion ||
    isHighlightIncorrectWordsQuestion ||
    isWriteFromDictationQuestion;

  // Check if this is the new standardized format
  const isStandardizedFormat =
    evaluationWithParsedAnalysis.detailedAnalysis?.scoring &&
    evaluationWithParsedAnalysis.detailedAnalysis?.analysis;

  // Calculate max score for accuracy level
  const maxScore = isStandardizedFormat
    ? evaluationWithParsedAnalysis.detailedAnalysis.scoring.overall.maxScore
    : evaluationWithParsedAnalysis.detailedAnalysis?.scores
    ? Object.values(
        evaluationWithParsedAnalysis.detailedAnalysis.scores
      ).reduce((sum: number, score: any) => sum + score.max, 0)
    : evaluationWithParsedAnalysis.detailedAnalysis?.maxContentScore !==
      undefined
    ? (evaluationWithParsedAnalysis.detailedAnalysis.maxContentScore || 0) +
      (evaluationWithParsedAnalysis.detailedAnalysis.maxFormScore || 0) +
      (evaluationWithParsedAnalysis.detailedAnalysis.maxGrammarScore || 0) +
      (evaluationWithParsedAnalysis.detailedAnalysis.maxVocabularyScore || 0)
    : undefined;

  const accuracyLevel = getAccuracyLevel(
    evaluationWithParsedAnalysis.score,
    maxScore
  );

  // Function to render reading question details with correct/incorrect answers
  const renderReadingQuestionDetails = (
    qType: string,
    analysis: any,
    isCorrect: boolean,
    questionData?: any
  ) => {
    if (
      qType === 'MULTIPLE_CHOICE_SINGLE_ANSWER_READING' ||
      qType === 'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING' ||
      qType === 'SELECT_MISSING_WORD'
    ) {
      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Answer Details
          </h4>
          <div className='space-y-3'>
            <div>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1'>
                Your Answer:
              </label>
              <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800'>
                <p className='text-sm text-blue-800 dark:text-blue-200'>
                  {analysis.selectedOptionText || 'Not selected'}
                </p>
              </div>
            </div>
            {!isCorrect && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1'>
                  ✅ Correct Answer:
                </label>
                <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800'>
                  <p className='text-sm text-green-800 dark:text-green-200'>
                    {analysis.correctOptionText || 'Unknown'}
                  </p>
                </div>
              </div>
            )}
            {analysis.explanation && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1'>
                  Explanation:
                </label>
                <div className='p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600'>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {analysis.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (
      qType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING' ||
      qType === 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING'
    ) {
      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Answer Details
          </h4>
          <div className='space-y-4'>
            {analysis.correctSelected > 0 && (
              <div>
                <label className='text-sm font-medium text-green-700 dark:text-green-300 block mb-2'>
                  ✅ Correct Answers Selected ({analysis.correctSelected}):
                </label>
                <div className='space-y-2'>
                  {analysis.selectedOptionTexts
                    ?.filter((_: any, idx: number) =>
                      analysis.selectedOptions?.[idx]
                        ? analysis.correctAnswers?.includes(
                            analysis.selectedOptions[idx]
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

            {analysis.incorrectlySelectedTexts?.length > 0 && (
              <div>
                <label className='text-sm font-medium text-red-700 dark:text-red-300 block mb-2'>
                  ❌ Incorrect Answers Selected (
                  {analysis.incorrectlySelectedTexts.length}):
                </label>
                <div className='space-y-2'>
                  {analysis.incorrectlySelectedTexts.map(
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

            {analysis.missedCorrectTexts?.length > 0 && (
              <div>
                <label className='text-sm font-medium text-yellow-700 dark:text-yellow-300 block mb-2'>
                  ⚠️ Missed Correct Answers (
                  {analysis.missedCorrectTexts.length}):
                </label>
                <div className='space-y-2'>
                  {analysis.missedCorrectTexts.map(
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

            {analysis.explanation && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1'>
                  Explanation:
                </label>
                <div className='p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600'>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {analysis.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (
      qType === 'READING_FILL_IN_THE_BLANKS' ||
      qType === 'FILL_IN_THE_BLANKS_DRAG_AND_DROP'
    ) {
      return (
        <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Blank-by-Blank Analysis
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {Object.entries(analysis.blankResults || {}).map(
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
        </div>
      );
    }

    if (qType === 'RE_ORDER_PARAGRAPHS') {
      // Get paragraph texts from question data
      const paragraphMap: { [key: string]: string } = {};
      if (questionData?.content?.paragraphs) {
        questionData.content.paragraphs.forEach((p: any) => {
          paragraphMap[p.id] = p.text;
        });
      }

      const getParagraphText = (id: string) => {
        return paragraphMap[id] || `Paragraph ${id}`;
      };

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
                {analysis.userOrder?.map((id: string, idx: number) => (
                  <div
                    key={idx}
                    className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800'
                  >
                    <p className='text-sm text-blue-800 dark:text-blue-200 leading-relaxed'>
                      <span className='font-semibold'>{idx + 1}.</span>{' '}
                      {getParagraphText(id)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {!isCorrect && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                  ✅ Correct Order:
                </label>
                <div className='space-y-2'>
                  {analysis.correctOrder?.map((id: string, idx: number) => (
                    <div
                      key={idx}
                      className='p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800'
                    >
                      <p className='text-sm text-green-800 dark:text-green-200 leading-relaxed'>
                        <span className='font-semibold'>{idx + 1}.</span>{' '}
                        {getParagraphText(id)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                Score:
              </label>
              <div className='p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600'>
                <p className='text-sm text-gray-700 dark:text-gray-300'>
                  {analysis.correctPairs} out of {analysis.maxPairs} adjacent
                  pairs correct
                </p>
              </div>
            </div>

            {analysis.explanation && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1'>
                  Explanation:
                </label>
                <div className='p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600'>
                  <p className='text-sm text-gray-700 dark:text-gray-300'>
                    {(() => {
                      let explanation = analysis.explanation;
                      // Replace paragraph IDs with their text in the explanation
                      if (questionData?.content?.paragraphs) {
                        questionData.content.paragraphs.forEach((p: any) => {
                          // Replace all occurrences of the paragraph ID with its text
                          const regex = new RegExp(`\\b${p.id}\\b`, 'g');
                          explanation = explanation.replace(regex, p.text);
                        });
                      }
                      return explanation;
                    })()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (qType === 'HIGHLIGHT_CORRECT_SUMMARY') {
      // Get option text from question data
      const getOptionText = (optionId: string) => {
        // Try both questionData.options and questionData.content.options
        const options = questionData?.options || questionData?.content?.options;
        if (options) {
          const option = options.find((opt: any) => opt.id === optionId);
          return option?.text || `Option ${optionId}`;
        }
        return `Option ${optionId}`;
      };

      const selectedText = getOptionText(analysis.selectedSummary);
      const correctText = analysis.correctAnswerIds?.[0]
        ? getOptionText(analysis.correctAnswerIds[0])
        : 'Unknown';

      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Answer Details
          </h4>
          <div className='space-y-3'>
            <div>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1'>
                Your Answer:
              </label>
              <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800'>
                <p className='text-sm text-blue-800 dark:text-blue-200 leading-relaxed'>
                  {selectedText}
                </p>
              </div>
            </div>
            {!isCorrect && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1'>
                  ✅ Correct Answer:
                </label>
                <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800'>
                  <p className='text-sm text-green-800 dark:text-green-200 leading-relaxed'>
                    {correctText}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (qType === 'HIGHLIGHT_INCORRECT_WORDS') {
      return (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
            Answer Details
          </h4>
          <div className='space-y-4'>
            {/* Correct Highlights */}
            <div>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                ✅ Correctly Identified ({analysis.correctHighlights}/
                {analysis.totalIncorrectWords}):
              </label>
              {analysis.cleanedHighlighted && analysis.cleanedIncorrect ? (
                <div className='space-y-2'>
                  {analysis.cleanedHighlighted
                    .filter((word: string) =>
                      analysis.cleanedIncorrect.includes(word)
                    )
                    .map((word: string, idx: number) => (
                      <div
                        key={idx}
                        className='p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800'
                      >
                        <p className='text-sm text-green-800 dark:text-green-200'>
                          {word}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800'>
                  <p className='text-sm text-green-800 dark:text-green-200'>
                    {analysis.correctHighlights} word(s) correctly identified
                  </p>
                </div>
              )}
            </div>

            {/* Missed Incorrect Words */}
            {analysis.totalIncorrectWords > analysis.correctHighlights && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                  ⚠️ Missed Incorrect Words (
                  {analysis.totalIncorrectWords - analysis.correctHighlights}):
                </label>
                <div className='space-y-2'>
                  {analysis.cleanedIncorrect
                    .filter(
                      (word: string) =>
                        !analysis.cleanedHighlighted.includes(word)
                    )
                    .map((word: string, idx: number) => (
                      <div
                        key={idx}
                        className='p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800'
                      >
                        <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                          {word}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Incorrectly Highlighted Words */}
            {analysis.incorrectHighlights > 0 && (
              <div>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2'>
                  ❌ Incorrectly Highlighted ({analysis.incorrectHighlights}):
                </label>
                <div className='space-y-2'>
                  {analysis.cleanedHighlighted
                    .filter(
                      (word: string) =>
                        !analysis.cleanedIncorrect.includes(word)
                    )
                    .map((word: string, idx: number) => (
                      <div
                        key={idx}
                        className='p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800'
                      >
                        <p className='text-sm text-red-800 dark:text-red-200'>
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
                <span className='font-semibold text-green-600 dark:text-green-400'>
                  {analysis.correctHighlights}
                </span>{' '}
                out of{' '}
                <span className='font-semibold'>
                  {analysis.totalIncorrectWords}
                </span>{' '}
                incorrect words
                {analysis.incorrectHighlights > 0 &&
                  ` and incorrectly highlighted ${analysis.incorrectHighlights} correct word(s)`}
                .
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Function to render text with error highlighting
  const renderHighlightedText = (text: string, errorAnalysis: any) => {
    if (!text || !errorAnalysis) return <span>{text}</span>;

    const allErrors = [
      // Writing question errors
      ...(errorAnalysis.grammarErrors || []).map((error: any) => ({
        ...error,
        type: 'grammar',
      })),
      ...(errorAnalysis.spellingErrors || []).map((error: any) => ({
        ...error,
        type: 'spelling',
      })),
      ...(errorAnalysis.vocabularyIssues || []).map((error: any) => ({
        ...error,
        type: 'vocabulary',
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
        ep.error.type === 'grammar'
          ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600'
          : ep.error.type === 'spelling'
          ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600'
          : ep.error.type === 'vocabulary'
          ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-600'
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Scoring Table */}
      <div className='space-y-4'>
        {!isFillInTheBlanksQuestion && (
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
            Detailed Results
          </h3>
        )}
        {renderScoringTable()}
      </div>

      {/* Overall Score Summary */}
      {!isCorrectTotalFormatQuestion && (
        <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              {/* <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Scoring Criteria: {getScoringCriteria(questionType).join(' + ')}
              </h4> */}
              {!isCorrectTotalFormatQuestion && (
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  <>
                    Your Score:{' '}
                    <span className='font-semibold text-green-600 dark:text-green-400'>
                      {evaluationWithParsedAnalysis.score}
                    </span>
                    {evaluationWithParsedAnalysis.detailedAnalysis?.scores && (
                      <span className='ml-2 text-gray-500'>
                        /{' '}
                        {Object.values(
                          evaluationWithParsedAnalysis.detailedAnalysis.scores
                        ).reduce(
                          (sum: number, score: any) => sum + score.max,
                          0
                        )}{' '}
                        points
                      </span>
                    )}
                  </>
                </h4>
              )}
              {isMultipleChoiceMultipleQuestion &&
                evaluationWithParsedAnalysis.detailedAnalysis?.totalCorrect && (
                  <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Correct Options:{' '}
                    <span className='font-semibold text-green-600 dark:text-green-400'>
                      {evaluationWithParsedAnalysis.detailedAnalysis
                        .correctSelected || evaluationWithParsedAnalysis.score}
                    </span>
                    <span className='ml-1 text-gray-500'>
                      /{' '}
                      {
                        evaluationWithParsedAnalysis.detailedAnalysis
                          .totalCorrect
                      }{' '}
                      options
                    </span>
                  </h4>
                )}
            </div>
            <div className='flex items-center space-x-4'>
              <div className='bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full'>
                <span className='text-sm font-medium text-blue-800 dark:text-blue-300'>
                  {questionType.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MCQ Multiple Answers Score Summary */}
      {isMultipleChoiceMultipleQuestion &&
        evaluationWithParsedAnalysis.detailedAnalysis?.totalCorrect && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Correct Options:{' '}
                  <span className='font-semibold text-green-600 dark:text-green-400'>
                    {evaluationWithParsedAnalysis.detailedAnalysis
                      .correctSelected || evaluationWithParsedAnalysis.score}
                  </span>
                  <span className='ml-1 text-gray-500'>
                    /{' '}
                    {evaluationWithParsedAnalysis.detailedAnalysis.totalCorrect}{' '}
                    options
                  </span>
                </h4>
                <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                  {evaluationWithParsedAnalysis.detailedAnalysis
                    .incorrectSelected > 0 && (
                    <span className='text-red-600 dark:text-red-400'>
                      {
                        evaluationWithParsedAnalysis.detailedAnalysis
                          .incorrectSelected
                      }{' '}
                      incorrect selection(s)
                    </span>
                  )}
                </p>
              </div>
              <div className='flex items-center space-x-4'>
                <div className='bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full'>
                  <span className='text-sm font-medium text-blue-800 dark:text-blue-300'>
                    {questionType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Reorder Paragraphs Score Summary */}
      {isReorderParagraphsQuestion &&
        evaluationWithParsedAnalysis.detailedAnalysis?.maxPairs !==
          undefined && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Correct Pairs:{' '}
                  <span className='font-semibold text-green-600 dark:text-green-400'>
                    {evaluationWithParsedAnalysis.detailedAnalysis
                      .correctPairs || evaluationWithParsedAnalysis.score}
                  </span>
                  <span className='ml-1 text-gray-500'>
                    / {evaluationWithParsedAnalysis.detailedAnalysis.maxPairs}{' '}
                    pairs
                  </span>
                </h4>
              </div>
              <div className='flex items-center space-x-4'>
                <div className='bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full'>
                  <span className='text-sm font-medium text-blue-800 dark:text-blue-300'>
                    {questionType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Highlight Incorrect Words Score Summary */}
      {isHighlightIncorrectWordsQuestion &&
        evaluationWithParsedAnalysis.detailedAnalysis?.totalIncorrectWords !==
          undefined && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Correct Highlights:{' '}
                  <span className='font-semibold text-green-600 dark:text-green-400'>
                    {evaluationWithParsedAnalysis.detailedAnalysis
                      .correctHighlights || evaluationWithParsedAnalysis.score}
                  </span>
                  <span className='ml-1 text-gray-500'>
                    /{' '}
                    {
                      evaluationWithParsedAnalysis.detailedAnalysis
                        .totalIncorrectWords
                    }{' '}
                    words
                  </span>
                </h4>
                <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                  {evaluationWithParsedAnalysis.detailedAnalysis
                    .incorrectHighlights > 0 && (
                    <span className='text-red-600 dark:text-red-400'>
                      {
                        evaluationWithParsedAnalysis.detailedAnalysis
                          .incorrectHighlights
                      }{' '}
                      incorrect highlight(s)
                    </span>
                  )}
                </p>
              </div>
              <div className='flex items-center space-x-4'>
                <div className='bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full'>
                  <span className='text-sm font-medium text-blue-800 dark:text-blue-300'>
                    {questionType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Transcribed Audio for Answer Short Question (always show) */}
      {questionType === 'ANSWER_SHORT_QUESTION' &&
        evaluationWithParsedAnalysis.detailedAnalysis?.userText && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
            {/* Error Analysis Header */}
            <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
              <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                Error Analysis
              </h4>
              <div className='flex flex-wrap items-center gap-4 text-sm'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-pink-500 rounded-full'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Content
                  </span>
                </div>
                <span className='text-gray-500 dark:text-gray-400 text-xs'>
                  * Click colored words for explanation
                </span>
              </div>
            </div>

            {/* Transcribed Audio Section */}
            <div className='p-6'>
              <div className='mb-3'>
                <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Transcribed Audio:
                </h5>
              </div>
              <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border'>
                <div className='text-sm leading-relaxed text-gray-800 dark:text-gray-200'>
                  {renderHighlightedText(
                    evaluationWithParsedAnalysis.detailedAnalysis.userText ||
                      '',
                    evaluationWithParsedAnalysis.detailedAnalysis.errorAnalysis
                  )}
                </div>
              </div>
            </div>

            {/* Show correct answer for Answer Short Question if incorrect */}
            {!evaluationWithParsedAnalysis.isCorrect && (
              <div className='p-6 border-t border-gray-200 dark:border-gray-700'>
                <div className='mb-3'>
                  <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    ✅ Correct Answer:
                  </h5>
                </div>
                <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800'>
                  <div className='text-sm leading-relaxed text-green-800 dark:text-green-200 font-medium'>
                    {evaluationWithParsedAnalysis.detailedAnalysis
                      ?.correctAnswers?.[0] || 'Expected answer'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Transcribed Audio for Repeat Sentence (always show) */}
      {questionType === 'REPEAT_SENTENCE' &&
        evaluationWithParsedAnalysis.detailedAnalysis?.userText && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
            {/* Error Analysis Header */}
            <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
              <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                Error Analysis
              </h4>
              <div className='flex flex-wrap items-center gap-4 text-sm'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-orange-500 rounded-full'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Pronunciation
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Fluency
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-pink-500 rounded-full'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Content
                  </span>
                </div>
                <span className='text-gray-500 dark:text-gray-400 text-xs'>
                  * Click colored words for explanation
                </span>
              </div>
            </div>

            {/* Transcribed Audio Section */}
            <div className='p-6'>
              <div className='mb-3'>
                <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Transcribed Audio:
                </h5>
              </div>
              <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border'>
                <div className='text-sm leading-relaxed text-gray-800 dark:text-gray-200'>
                  {renderHighlightedText(
                    evaluationWithParsedAnalysis.detailedAnalysis.userText ||
                      '',
                    evaluationWithParsedAnalysis.detailedAnalysis.errorAnalysis
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Transcribed Audio for Read Aloud (always show) */}
      {questionType === 'READ_ALOUD' &&
        evaluationWithParsedAnalysis.detailedAnalysis?.recognizedText && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
            {/* Error Analysis Header */}
            <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
              <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                Error Analysis
              </h4>
              <div className='flex flex-wrap items-center gap-4 text-sm'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-orange-500 rounded-full'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Pronunciation
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Fluency
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-pink-500 rounded-full'></div>
                  <span className='text-gray-600 dark:text-gray-400'>
                    Content
                  </span>
                </div>
                <span className='text-gray-500 dark:text-gray-400 text-xs'>
                  * Click colored words for explanation
                </span>
              </div>
            </div>

            {/* Transcribed Audio Section */}
            <div className='p-6'>
              <div className='mb-3'>
                <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Transcribed Audio:
                </h5>
              </div>
              <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border'>
                <div className='text-sm leading-relaxed text-gray-800 dark:text-gray-200'>
                  {renderHighlightedText(
                    evaluationWithParsedAnalysis.detailedAnalysis
                      .recognizedText || '',
                    evaluationWithParsedAnalysis.detailedAnalysis.errorAnalysis
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Error Analysis for Writing, Speaking, and Text-based Questions (but not WRITE_FROM_DICTATION which has its own handler) */}
      {(questionType === 'WRITE_ESSAY' ||
        questionType === 'SUMMARIZE_WRITTEN_TEXT' ||
        questionType === 'SUMMARIZE_SPOKEN_TEXT' ||
        questionType === 'LISTENING_FILL_IN_THE_BLANKS' ||
        (isAudioBasedQuestion &&
          questionType !== 'ANSWER_SHORT_QUESTION' &&
          questionType !== 'REPEAT_SENTENCE' &&
          questionType !== 'READ_ALOUD')) &&
        questionType !== 'WRITE_FROM_DICTATION' &&
        evaluationWithParsedAnalysis.detailedAnalysis?.errorAnalysis && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
            {(() => {
              const errorAnalysis =
                evaluationWithParsedAnalysis.detailedAnalysis.errorAnalysis;
              const hasErrors =
                (errorAnalysis.grammarErrors &&
                  errorAnalysis.grammarErrors.length > 0) ||
                (errorAnalysis.spellingErrors &&
                  errorAnalysis.spellingErrors.length > 0) ||
                (errorAnalysis.vocabularyIssues &&
                  errorAnalysis.vocabularyIssues.length > 0) ||
                (errorAnalysis.pronunciationErrors &&
                  errorAnalysis.pronunciationErrors.length > 0) ||
                (errorAnalysis.fluencyErrors &&
                  errorAnalysis.fluencyErrors.length > 0) ||
                (errorAnalysis.contentErrors &&
                  errorAnalysis.contentErrors.length > 0);

              if (!hasErrors) {
                // No errors found - show positive feedback (only for audio-based and listening questions)
                if (
                  isAudioBasedQuestion ||
                  questionType === 'LISTENING_FILL_IN_THE_BLANKS'
                ) {
                  const analysisTitle = isAudioBasedQuestion
                    ? 'Speaking Quality Analysis'
                    : 'Listening Quality Analysis';

                  return (
                    <>
                      <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
                        <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                          {analysisTitle}
                        </h4>
                        <div className='flex items-center space-x-2'>
                          <div className='w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'>
                            <svg
                              className='w-2.5 h-2.5 text-white'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                            >
                              <path
                                fillRule='evenodd'
                                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                clipRule='evenodd'
                              />
                            </svg>
                          </div>
                          <span className='text-green-700 dark:text-green-300 font-medium'>
                            {isAudioBasedQuestion
                              ? 'Excellent speaking quality! No errors detected'
                              : 'Excellent listening accuracy! No errors detected'}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                }
                // For SUMMARIZE_SPOKEN_TEXT and SUMMARIZE_WRITTEN_TEXT with no errors, show the text section
                if (
                  questionType === 'SUMMARIZE_SPOKEN_TEXT' ||
                  questionType === 'SUMMARIZE_WRITTEN_TEXT'
                ) {
                  return (
                    <>
                      <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
                        <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                          Error Analysis
                        </h4>
                        <div className='flex flex-wrap items-center gap-4 text-sm'>
                          <div className='flex items-center space-x-2'>
                            <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Grammar
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Spelling
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <div className='w-3 h-3 bg-purple-500 rounded-full'></div>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Vocabulary
                            </span>
                          </div>
                          <span className='text-gray-500 dark:text-gray-400 text-xs'>
                            * No errors detected
                          </span>
                        </div>
                      </div>

                      <div className='p-6'>
                        <div className='mb-3'>
                          <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Your Text:
                          </h5>
                        </div>
                        <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border'>
                          <div className='text-sm leading-relaxed text-gray-800 dark:text-gray-200'>
                            {evaluationWithParsedAnalysis.detailedAnalysis
                              .userText || ''}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                }
                // For other writing questions with no errors, don't show any section
                return null;
              }

              // Has errors - show error analysis
              return (
                <>
                  <div className='p-6 border-b border-gray-200 dark:border-gray-700'>
                    <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                      Error Analysis
                    </h4>
                    <div className='flex flex-wrap items-center gap-4 text-sm'>
                      {/* Writing error types */}
                      {!isAudioBasedQuestion && (
                        <>
                          <div className='flex items-center space-x-2'>
                            <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Grammar
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Spelling
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <div className='w-3 h-3 bg-purple-500 rounded-full'></div>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Vocabulary
                            </span>
                          </div>
                        </>
                      )}

                      {/* Speaking error types */}
                      {isAudioBasedQuestion && (
                        <>
                          <div className='flex items-center space-x-2'>
                            <div className='w-3 h-3 bg-orange-500 rounded-full'></div>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Pronunciation
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Fluency
                            </span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <div className='w-3 h-3 bg-pink-500 rounded-full'></div>
                            <span className='text-gray-600 dark:text-gray-400'>
                              Content
                            </span>
                          </div>
                          {questionType === 'DESCRIBE_IMAGE' && (
                            <div className='flex items-center space-x-2'>
                              <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                              <span className='text-gray-600 dark:text-gray-400'>
                                Grammar
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      <span className='text-gray-500 dark:text-gray-400 text-xs'>
                        * Click colored words for explanation
                      </span>
                    </div>
                  </div>

                  <div className='p-6'>
                    <div className='mb-3'>
                      <h5 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {questionType === 'LISTENING_FILL_IN_THE_BLANKS'
                          ? 'Your Answers:'
                          : 'Your Text:'}
                      </h5>
                    </div>
                    <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border'>
                      <div className='text-sm leading-relaxed text-gray-800 dark:text-gray-200'>
                        {renderHighlightedText(
                          evaluationWithParsedAnalysis.detailedAnalysis
                            .userText || '',
                          evaluationWithParsedAnalysis.detailedAnalysis
                            .errorAnalysis
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      {/* Error Detail Modal */}
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

      {/* Detailed Explanation for non-Reading Questions */}
      {evaluationWithParsedAnalysis.detailedAnalysis?.explanation &&
        questionType !== 'MULTIPLE_CHOICE_SINGLE_ANSWER_READING' &&
        questionType !== 'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING' &&
        questionType !== 'RE_ORDER_PARAGRAPHS' &&
        questionType !== 'READING_FILL_IN_THE_BLANKS' &&
        questionType !== 'FILL_IN_THE_BLANKS_DRAG_AND_DROP' && (
          <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <Info className='h-5 w-5 text-blue-600' />
              <span>Detailed Explanation</span>
            </h4>
            <div className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
              {evaluationWithParsedAnalysis.detailedAnalysis.explanation}
            </div>
          </div>
        )}

      {/* AI Improvement Tips */}
      {/* {evaluationWithParsedAnalysis.suggestions &&
        Array.isArray(evaluationWithParsedAnalysis.suggestions) &&
        evaluationWithParsedAnalysis.suggestions.length > 0 && (
          <div className='bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <AlertCircle className='h-5 w-5 text-yellow-600' />
              <span>AI Improvement Tips</span>
            </h4>
            <div className='space-y-3'>
              {evaluationWithParsedAnalysis.suggestions.map(
                (suggestion: string, index: number) => (
                  <div
                    key={index}
                    className='text-sm text-gray-700 dark:text-gray-300'
                  >
                    {suggestion}
                  </div>
                )
              )}
            </div>
          </div>
        )} */}
    </div>
  );
};

export default QuestionResponseEvaluator;
