import { PteQuestionTypeName } from '../types/pte';

/**
 * Mapping of PteQuestionTypeName enum values to URL slug format
 * Used to navigate to fullscreen practice pages
 */
export const questionTypeToSlugMap: Record<PteQuestionTypeName, string> = {
  // Speaking
  [PteQuestionTypeName.READ_ALOUD]: 'read-aloud',
  [PteQuestionTypeName.REPEAT_SENTENCE]: 'repeat-sentence',
  [PteQuestionTypeName.DESCRIBE_IMAGE]: 'describe-image',
  [PteQuestionTypeName.RE_TELL_LECTURE]: 're-tell-lecture',
  [PteQuestionTypeName.ANSWER_SHORT_QUESTION]: 'answer-short-question',
  [PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION]: 'summarize-group-discussion',
  [PteQuestionTypeName.RESPOND_TO_A_SITUATION]: 'respond-to-a-situation',

  // Writing
  [PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT]: 'summarize-written-text',
  [PteQuestionTypeName.WRITE_ESSAY]: 'write-essay',

  // Reading
  [PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP]: 'fill-in-the-blanks-drag-and-drop',
  [PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING]:
    'multiple-choice-multiple-answers-reading',
  [PteQuestionTypeName.RE_ORDER_PARAGRAPHS]: 're-order-paragraphs',
  [PteQuestionTypeName.READING_FILL_IN_THE_BLANKS]: 'reading-fill-in-the-blanks',
  [PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING]:
    'multiple-choice-single-answer-reading',

  // Listening
  [PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT]: 'summarize-spoken-text',
  [PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING]:
    'multiple-choice-multiple-answers-listening',
  [PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS]: 'listening-fill-in-the-blanks',
  [PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY]: 'highlight-correct-summary',
  [PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING]:
    'multiple-choice-single-answer-listening',
  [PteQuestionTypeName.SELECT_MISSING_WORD]: 'select-missing-word',
  [PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS]: 'highlight-incorrect-words',
  [PteQuestionTypeName.WRITE_FROM_DICTATION]: 'write-from-dictation',
};

/**
 * Convert a PteQuestionTypeName to its URL slug
 * @param questionType - The question type enum value
 * @returns The URL slug for the question type
 */
export const getQuestionTypeSlug = (questionType: PteQuestionTypeName): string => {
  return questionTypeToSlugMap[questionType];
};

/**
 * Get the fullscreen practice URL path for a question type
 * @param questionType - The question type enum value
 * @returns The full practice page path
 */
export const getPracticePagePath = (questionType: PteQuestionTypeName): string => {
  return `/practice/${getQuestionTypeSlug(questionType)}`;
};
