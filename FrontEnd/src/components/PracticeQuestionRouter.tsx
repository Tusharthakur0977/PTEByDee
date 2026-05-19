import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const componentMap: { [key: string]: React.LazyExoticComponent<React.FC<any>> } = {
  READ_ALOUD: React.lazy(() => import('../pages/practice/PracticeReadAloud')),
  REPEAT_SENTENCE: React.lazy(() => import('../pages/practice/PracticeRepeatSentence')),
  DESCRIBE_IMAGE: React.lazy(() => import('../pages/practice/PracticeDescribeImage')),
  RE_TELL_LECTURE: React.lazy(() => import('../pages/practice/PracticeReTellLecture')),
  RESPOND_TO_A_SITUATION: React.lazy(() => import('../pages/practice/PracticeRespondToASituation')),
  ANSWER_SHORT_QUESTION: React.lazy(() => import('../pages/practice/PracticeAnswerShortQuestion')),
  SUMMARIZE_WRITTEN_TEXT: React.lazy(() => import('../pages/practice/PracticeSummarizeWrittenText')),
  WRITE_ESSAY: React.lazy(() => import('../pages/practice/PracticeWriteEssay')),
  MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING: React.lazy(() => import('../pages/practice/PracticeMultipleChoiceMultipleAnswersReading')),
  MULTIPLE_CHOICE_SINGLE_ANSWER_READING: React.lazy(() => import('../pages/practice/PracticeMultipleChoiceSingleAnswer')),
  RE_ORDER_PARAGRAPHS: React.lazy(() => import('../pages/practice/PracticeReOrderParagraphs')),
  READING_FILL_IN_THE_BLANKS: React.lazy(() => import('../pages/practice/PracticeFillInTheBlanksDropdown')),
  FILL_IN_THE_BLANKS_DRAG_AND_DROP: React.lazy(() => import('../pages/practice/PracticeFillInTheBlanksDragDrop')),
  SUMMARIZE_SPOKEN_TEXT: React.lazy(() => import('../pages/practice/PracticeSummarizeSpokenText')),
  LISTENING_FILL_IN_THE_BLANKS: React.lazy(() => import('../pages/practice/PracticeListeningFillInTheBlanks')),
  HIGHLIGHT_CORRECT_SUMMARY: React.lazy(() => import('../pages/practice/PracticeHighlightCorrectSummary')),
  MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING: React.lazy(() => import('../pages/practice/PracticeMultipleChoiceMultipleAnswersListening')),
  MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING: React.lazy(() => import('../pages/practice/PracticeMultipleChoiceSingleAnswerListening')),
  SELECT_MISSING_WORD: React.lazy(() => import('../pages/practice/PracticeSelectMissingWord')),
  HIGHLIGHT_INCORRECT_WORDS: React.lazy(() => import('../pages/practice/PracticeHighlightIncorrectWords')),
  WRITE_FROM_DICTATION: React.lazy(() => import('../pages/practice/PracticeWriteFromDictation')),
  SUMMARIZE_GROUP_DISCUSSION: React.lazy(() => import('../pages/practice/PracticeSummarizeGroupDiscussion')),
};

const PracticeQuestionRouter: React.FC = () => {
  const { questionType, questionId } = useParams<{ questionType: string; questionId: string }>();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState<boolean>(true);

  const normalizedType = questionType?.toUpperCase().replace(/-/g, '_') || '';
  const PracticeComp = componentMap[normalizedType];

  useEffect(() => {
    if (!PracticeComp) {
      setIsValid(false);
      return;
    }

    if (questionId) {
      sessionStorage.setItem('activeQuestionId', questionId);
    }

    // Toggle global CSS prediction-mode to hide the Previous/Next footers
    document.body.classList.add('prediction-mode');
    return () => {
      document.body.classList.remove('prediction-mode');
    };
  }, [normalizedType, questionId, PracticeComp]);

  if (!isValid || !PracticeComp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Invalid Question Route</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The requested question type or practice path could not be found.
        </p>
        <button
          onClick={() => navigate('/portal/prediction')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition duration-200"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <React.Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading full-screen practice session...</p>
          </div>
        }
      >
        <PracticeComp />
      </React.Suspense>
    </div>
  );
};

export default PracticeQuestionRouter;
