import React, { Suspense } from 'react';
import { PreviousResponse } from '../services/questionResponse';
import GenericResponseDetailModal from './ResponseDetailModal';

// Dynamically import all specific response detail modals
const modals: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  WRITE_ESSAY: React.lazy(() => import('../pages/practice/PracticeWriteEssay/ResponseDetailModal')),
  WRITE_FROM_DICTATION: React.lazy(() => import('../pages/practice/PracticeWriteFromDictation/ResponseDetailModal')),
  SUMMARIZE_SPOKEN_TEXT: React.lazy(() => import('../pages/practice/PracticeSummarizeSpokenText/ResponseDetailModal')),
  SUMMARIZE_WRITTEN_TEXT: React.lazy(() => import('../pages/practice/PracticeSummarizeWrittenText/ResponseDetailModal')),
  MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING: React.lazy(() => import('../pages/practice/PracticeMultipleChoiceMultipleAnswersReading/ResponseDetailModal')),
  SUMMARIZE_GROUP_DISCUSSION: React.lazy(() => import('../pages/practice/PracticeSummarizeGroupDiscussion/ResponseDetailModal')),
  RE_TELL_LECTURE: React.lazy(() => import('../pages/practice/PracticeReTellLecture/ResponseDetailModal')),
  RESPOND_TO_A_SITUATION: React.lazy(() => import('../pages/practice/PracticeRespondToASituation/ResponseDetailModal')),
  REPEAT_SENTENCE: React.lazy(() => import('../pages/practice/PracticeRepeatSentence/ResponseDetailModal')),
  READING_FILL_IN_THE_BLANKS: React.lazy(() => import('../pages/practice/PracticeReadingFillInTheBlanks/ResponseDetailModal')),
  RE_ORDER_PARAGRAPHS: React.lazy(() => import('../pages/practice/PracticeReOrderParagraphs/ResponseDetailModal')),
  READ_ALOUD: React.lazy(() => import('../pages/practice/PracticeReadAloud/ResponseDetailModal')),
  MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING: React.lazy(() => import('../pages/practice/PracticeMultipleChoiceSingleAnswerListening/ResponseDetailModal')),
  ANSWER_SHORT_QUESTION: React.lazy(() => import('../pages/practice/PracticeAnswerShortQuestion/ResponseDetailModal')),
  MULTIPLE_CHOICE_SINGLE_ANSWER_READING: React.lazy(() => import('../pages/practice/PracticeMultipleChoiceSingleAnswer/ResponseDetailModal')),
  MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING: React.lazy(() => import('../pages/practice/PracticeMultipleChoiceMultipleAnswersListening/ResponseDetailModal')),
  LISTENING_FILL_IN_THE_BLANKS: React.lazy(() => import('../pages/practice/PracticeListeningFillInTheBlanks/ResponseDetailModal')),
  HIGHLIGHT_INCORRECT_WORDS: React.lazy(() => import('../pages/practice/PracticeHighlightIncorrectWords/ResponseDetailModal')),
  HIGHLIGHT_CORRECT_SUMMARY: React.lazy(() => import('../pages/practice/PracticeHighlightCorrectSummary/ResponseDetailModal')),
  FILL_IN_THE_BLANKS_DROP_DOWN: React.lazy(() => import('../pages/practice/PracticeFillInTheBlanksDropdown/ResponseDetailModal')),
  FILL_IN_THE_BLANKS_DRAG_AND_DROP: React.lazy(() => import('../pages/practice/PracticeFillInTheBlanksDragDrop/ResponseDetailModal')),
  DESCRIBE_IMAGE: React.lazy(() => import('../pages/practice/PracticeDescribeImage/ResponseDetailModal')),
  SELECT_MISSING_WORD: React.lazy(() => import('../pages/practice/PracticeSelectMissingWord/ResponseDetailModal')),
};

interface SharedResponseModalLoaderProps {
  isOpen: boolean;
  onClose: () => void;
  response: PreviousResponse | null;
  questionType: string;
}

const SharedResponseModalLoader: React.FC<SharedResponseModalLoaderProps> = ({
  isOpen,
  onClose,
  response,
  questionType,
}) => {
  if (!isOpen || !response) return null;

  const SpecificModal = modals[questionType];

  return (
    <Suspense fallback={<div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
      {SpecificModal ? (
        <SpecificModal isOpen={isOpen} onClose={onClose} response={response} />
      ) : (
        <GenericResponseDetailModal isOpen={isOpen} onClose={onClose} response={response} questionType={questionType} />
      )}
    </Suspense>
  );
};

export default SharedResponseModalLoader;
