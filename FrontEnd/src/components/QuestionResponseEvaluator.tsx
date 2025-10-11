import {
  AlertCircle,
  CheckCircle,
  Info,
  Target,
  Volume2,
  XCircle,
} from 'lucide-react';
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
}

const QuestionResponseEvaluator: React.FC<QuestionResponseEvaluatorProps> = ({
  evaluation,
  questionType,
  transcribedText,
  className = '',
}) => {
  const [selectedError, setSelectedError] = useState<any>(null);
  console.log(evaluation, 'EEEEEE');

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
      LISTENING_FILL_IN_THE_BLANKS: ['Listening', 'Writing'],
      HIGHLIGHT_CORRECT_SUMMARY: ['Listening'],
      SELECT_MISSING_WORD: ['Listening'],
      HIGHLIGHT_INCORRECT_WORDS: ['Listening'],
      WRITE_FROM_DICTATION: ['Listening', 'Writing'],
    };

    return criteriaMap[questionType] || ['Overall Performance'];
  };

  // Function to render scoring table based on question type
  const renderScoringTable = () => {
    const { detailedAnalysis } = evaluation;

    // For SUMMARIZE_SPOKEN_TEXT and WRITE_ESSAY with structured scores
    if (
      detailedAnalysis?.scores &&
      typeof detailedAnalysis.scores === 'object'
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

    // For simple scoring (multiple choice, etc.)
    const scoringCriteria = getScoringCriteria(questionType);
    if (isCorrectTotalFormatQuestion) return;
    return (
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
        <div className='text-center'>
          <div className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            {evaluation.score > 100 ? `${evaluation.score}%` : evaluation.score}
          </div>
          <div className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
            {evaluation.isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
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

  // Calculate max score for accuracy level
  const maxScore = evaluation.detailedAnalysis?.scores
    ? Object.values(evaluation.detailedAnalysis.scores).reduce(
        (sum: number, score: any) => sum + score.max,
        0
      )
    : evaluation.detailedAnalysis?.maxContentScore !== undefined
    ? (evaluation.detailedAnalysis.maxContentScore || 0) +
      (evaluation.detailedAnalysis.maxFormScore || 0) +
      (evaluation.detailedAnalysis.maxGrammarScore || 0) +
      (evaluation.detailedAnalysis.maxVocabularyScore || 0)
    : undefined;

  const accuracyLevel = getAccuracyLevel(evaluation.score, maxScore);

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

    // Instead of using character positions, let's use word-based matching
    // This is more reliable since AI might not get exact character positions right
    const words = text.split(/(\s+)/); // Split but keep whitespace
    const result: React.ReactNode[] = [];

    words.forEach((word, index) => {
      const cleanWord = word
        .trim()
        .toLowerCase()
        .replace(/[.,!?;:"'()]/g, '');

      // Find if this word matches any error
      const matchingError = allErrors.find((error) => {
        const errorText = error.text.toLowerCase().replace(/[.,!?;:"'()]/g, '');
        return (
          cleanWord === errorText || word.toLowerCase().includes(errorText)
        );
      });

      if (matchingError && cleanWord.length > 0) {
        // This word has an error - highlight it
        const colorClass =
          matchingError.type === 'grammar'
            ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600'
            : matchingError.type === 'spelling'
            ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600'
            : matchingError.type === 'vocabulary'
            ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-600'
            : matchingError.type === 'pronunciation'
            ? 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-600'
            : matchingError.type === 'fluency'
            ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600'
            : matchingError.type === 'content'
            ? 'bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 border border-pink-300 dark:border-pink-600'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600';

        result.push(
          <span
            key={`error-${index}`}
            className={`${colorClass} px-1 py-0.5 rounded cursor-pointer hover:shadow-md transition-all duration-200 font-medium`}
            onClick={() => setSelectedError(matchingError)}
            title={`Click to see ${matchingError.type} error details`}
          >
            {word}
          </span>
        );
      } else {
        // Regular text
        result.push(<span key={`text-${index}`}>{word}</span>);
      }
    });

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
                      {evaluation.score}
                    </span>
                    {evaluation.detailedAnalysis?.scores && (
                      <span className='ml-2 text-gray-500'>
                        /{' '}
                        {Object.values(
                          evaluation.detailedAnalysis.scores
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
                evaluation.detailedAnalysis?.totalCorrect && (
                  <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Correct Options:{' '}
                    <span className='font-semibold text-green-600 dark:text-green-400'>
                      {evaluation.detailedAnalysis.correctSelected ||
                        evaluation.score}
                    </span>
                    <span className='ml-1 text-gray-500'>
                      / {evaluation.detailedAnalysis.totalCorrect} options
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
        evaluation.detailedAnalysis?.totalCorrect && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Correct Options:{' '}
                  <span className='font-semibold text-green-600 dark:text-green-400'>
                    {evaluation.detailedAnalysis.correctSelected ||
                      evaluation.score}
                  </span>
                  <span className='ml-1 text-gray-500'>
                    / {evaluation.detailedAnalysis.totalCorrect} options
                  </span>
                </h4>
                <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                  {evaluation.detailedAnalysis.incorrectSelected > 0 && (
                    <span className='text-red-600 dark:text-red-400'>
                      {evaluation.detailedAnalysis.incorrectSelected} incorrect
                      selection(s)
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
        evaluation.detailedAnalysis?.maxPairs !== undefined && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Correct Pairs:{' '}
                  <span className='font-semibold text-green-600 dark:text-green-400'>
                    {evaluation.detailedAnalysis.correctPairs ||
                      evaluation.score}
                  </span>
                  <span className='ml-1 text-gray-500'>
                    / {evaluation.detailedAnalysis.maxPairs} pairs
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
        evaluation.detailedAnalysis?.totalIncorrectWords !== undefined && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Correct Highlights:{' '}
                  <span className='font-semibold text-green-600 dark:text-green-400'>
                    {evaluation.detailedAnalysis.correctHighlights ||
                      evaluation.score}
                  </span>
                  <span className='ml-1 text-gray-500'>
                    / {evaluation.detailedAnalysis.totalIncorrectWords} words
                  </span>
                </h4>
                <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                  {evaluation.detailedAnalysis.incorrectHighlights > 0 && (
                    <span className='text-red-600 dark:text-red-400'>
                      {evaluation.detailedAnalysis.incorrectHighlights}{' '}
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

      {/* Write from Dictation Score Summary */}
      {isWriteFromDictationQuestion &&
        evaluation.detailedAnalysis?.totalWords !== undefined && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  Correct Words:{' '}
                  <span className='font-semibold text-green-600 dark:text-green-400'>
                    {evaluation.detailedAnalysis.correctWordCount ||
                      evaluation.score}
                  </span>
                  <span className='ml-1 text-gray-500'>
                    / {evaluation.detailedAnalysis.totalWords} words
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

      {/* Transcribed Text for Audio Questions */}
      {isAudioBasedQuestion && transcribedText && (
        <div className='bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800'>
          <h4 className='font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2'>
            <Volume2 className='h-5 w-5' />
            <span>Transcribed Audio</span>
          </h4>
          <div className='bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700'>
            <p className='text-purple-700 dark:text-purple-300 italic leading-relaxed'>
              "{transcribedText}"
            </p>
          </div>
        </div>
      )}

      {/* Fill in the Blanks Detailed Results */}
      {isFillInTheBlanksQuestion &&
        evaluation.detailedAnalysis?.blankResults && (
          <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <Target className='h-5 w-5' />
              <span>Blank-by-Blank Analysis</span>
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {Object.entries(evaluation.detailedAnalysis.blankResults).map(
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
                        <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
                      ) : (
                        <XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
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
        )}

      {/* Error Analysis for Writing, Speaking, and Text-based Questions */}
      {(questionType === 'WRITE_ESSAY' ||
        questionType === 'SUMMARIZE_WRITTEN_TEXT' ||
        questionType === 'SUMMARIZE_SPOKEN_TEXT' ||
        questionType === 'WRITE_FROM_DICTATION' ||
        questionType === 'LISTENING_FILL_IN_THE_BLANKS' ||
        isAudioBasedQuestion) &&
        evaluation.detailedAnalysis?.errorAnalysis && (
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
            {(() => {
              const errorAnalysis = evaluation.detailedAnalysis.errorAnalysis;
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
                // No errors found - show positive feedback
                const analysisTitle = isAudioBasedQuestion
                  ? 'Speaking Quality Analysis'
                  : questionType === 'LISTENING_FILL_IN_THE_BLANKS'
                  ? 'Listening Quality Analysis'
                  : 'Writing Quality Analysis';

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
                            : questionType === 'LISTENING_FILL_IN_THE_BLANKS'
                            ? 'Excellent listening accuracy! No errors detected'
                            : 'Excellent writing quality! No errors detected'}
                        </span>
                      </div>
                    </div>
                  </>
                );
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
                        {isAudioBasedQuestion
                          ? 'Transcribed Audio:'
                          : questionType === 'LISTENING_FILL_IN_THE_BLANKS'
                          ? 'Your Answers:'
                          : 'Your Text:'}
                      </h5>
                    </div>
                    <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border'>
                      <div className='text-sm leading-relaxed text-gray-800 dark:text-gray-200'>
                        {renderHighlightedText(
                          evaluation.detailedAnalysis.userText || '',
                          evaluation.detailedAnalysis.errorAnalysis
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

      {/* AI Improvement Tips */}
      {evaluation.suggestions &&
        Array.isArray(evaluation.suggestions) &&
        evaluation.suggestions.length > 0 && (
          <div className='bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800'>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2'>
              <AlertCircle className='h-5 w-5 text-yellow-600' />
              <span>AI Improvement Tips</span>
            </h4>
            <div className='space-y-3'>
              {evaluation.suggestions.map(
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
        )}
    </div>
  );
};

export default QuestionResponseEvaluator;
