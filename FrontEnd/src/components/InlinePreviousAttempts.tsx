import { ChevronDown, ChevronUp, Clock, Loader2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  getQuestionPreviousResponses,
  PreviousResponse,
} from '../services/questionResponse';

const PAGE_SIZE = 10;

interface QuestionContextInfo {
  text?: string;
  audioUrl?: string;
  imageUrl?: string;
  instructions?: string;
  difficultyLevel?: string;
  timeLimitSeconds?: number;
}

interface InlinePreviousAttemptsProps {
  questionId?: string;
  className?: string;
  onViewResponse?: (response: PreviousResponse) => void;
  questionContext?: QuestionContextInfo;
  question?: any;
}

const InlinePreviousAttempts: React.FC<InlinePreviousAttemptsProps> = ({
  questionId,
  className = '',
  onViewResponse,
  questionContext,
  question,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [responses, setResponses] = useState<PreviousResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [questionInfo, setQuestionInfo] = useState<{
    questionCode: string;
    questionType: string;
    sectionName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResponses = async (page = 1) => {
    if (!questionId) return;

    try {
      setLoading(true);
      const data = await getQuestionPreviousResponses(questionId, {
        page,
        limit: PAGE_SIZE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setResponses(data.responses);
      setQuestionInfo(data.question);
      setCurrentPage(data.pagination.currentPage);
      setTotalPages(data.pagination.totalPages);
      setTotalResponses(data.pagination.totalResponses);
      setError(null);
    } catch (err: any) {
      setQuestionInfo(null);
      setError(err.message || 'Failed to load previous attempts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!questionId) return;
    fetchResponses(1);
  }, [questionId]);

  const toggleOpen = () => {
    if (!isOpen) {
      fetchResponses(1);
    }
    setIsOpen((prev) => !prev);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const { scoreBadgeClass } = useMemo(
    () => ({
      scoreBadgeClass: (response: PreviousResponse) => {
        const score = response.questionScore ?? 0;
        const max = response.detailedAnalysis?.scores
          ? Object.values(response.detailedAnalysis.scores).reduce(
              (sum: number, s: any) => sum + (s?.max || 0),
              0,
            )
          : 0;
        const percentage = max > 0 ? (score / max) * 100 : score;

        if (percentage >= 80) {
          return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
        }
        if (percentage >= 60) {
          return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
        }
        if (percentage >= 40) {
          return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
        }
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      },
    }),
    [],
  );

  const getScoreText = (response: PreviousResponse) => {
    const score = response.questionScore ?? 0;
    const max = response.detailedAnalysis?.scores
      ? Object.values(response.detailedAnalysis.scores).reduce(
          (sum: number, s: any) => sum + (s?.max || 0),
          0,
        )
      : 0;
    if (max > 0) {
      return `${score}/${max}`;
    }
    return score ? `${score}` : '0';
  };

  const derivedContext = useMemo<QuestionContextInfo | null>(() => {
    if (questionContext) return questionContext;
    if (!question) return null;

    const text =
      question.content?.text ||
      question.textContent ||
      question.questionStatement ||
      question.instructions;
    const audioUrl = question.content?.audioUrl || question.audioUrl;
    const imageUrl = question.content?.imageUrl || question.imageUrl;
    const instructions = question.instructions;
    const difficultyLevel = question.difficultyLevel;
    const timeLimitSeconds =
      question.content?.timeLimit ||
      (question.durationMillis
        ? Math.round(question.durationMillis / 1000)
        : undefined);

    if (!text && !audioUrl && !imageUrl && !instructions && !difficultyLevel) {
      return null;
    }

    return {
      text,
      audioUrl,
      imageUrl,
      instructions,
      difficultyLevel,
      timeLimitSeconds,
    };
  }, [questionContext, question]);

  const optionLabelMap = useMemo<Record<string, string>>(() => {
    const rawOptions =
      question?.content?.options || question?.options || question?.optionsList;
    if (!Array.isArray(rawOptions)) return {};

    return rawOptions.reduce<Record<string, string>>((acc, item) => {
      if (typeof item === 'string') {
        acc[item] = item;
        return acc;
      }

      const id =
        (item as any).id ??
        (item as any).optionId ??
        (item as any).value ??
        (item as any).key ??
        '';
      const label =
        (item as any).text ??
        (item as any).label ??
        (item as any).value ??
        (item as any).name ??
        id;

      if (id) {
        acc[id] = label;
      }
      return acc;
    }, {});
  }, [question]);

  const getUserAnswerSummaries = (response: PreviousResponse) => {
    const summaries: { label: string; value: string }[] = [];

    if (response.textResponse) {
      summaries.push({
        label: 'Your response',
        value: response.textResponse,
      });
    }

    if (
      response.detailedAnalysis?.userText &&
      response.detailedAnalysis.userText !== response.textResponse
    ) {
      summaries.push({
        label: 'Transcribed response',
        value: response.detailedAnalysis.userText,
      });
    }

    if (response.selectedOptions?.length) {
      summaries.push({
        label:
          response.selectedOptions.length === 1
            ? 'Selected option'
            : 'Selected options',
        value: response.selectedOptions
          .map((value) => optionLabelMap[value] || value)
          .join(', '),
      });
    }

    if (response.selectedOption) {
      const label =
        optionLabelMap[response.selectedOption] || response.selectedOption;
      summaries.push({
        label: 'Selected option',
        value: label,
      });
    }

    if (response.selectedSummary) {
      summaries.push({
        label: 'Selected summary',
        value: response.selectedSummary,
      });
    }

    if (response.selectedWord) {
      summaries.push({
        label: 'Selected word',
        value: response.selectedWord,
      });
    }

    if (response.orderedItems?.length) {
      summaries.push({
        label: 'Ordered response',
        value: response.orderedItems.join(' -> '),
      });
    }

    if (response.highlightedWords?.length) {
      summaries.push({
        label: 'Highlighted words',
        value: response.highlightedWords.join(', '),
      });
    }

    if (response.orderedParagraphs?.length) {
      summaries.push({
        label: 'Ordered paragraphs',
        value: response.orderedParagraphs.join(' -> '),
      });
    }

    if (response.blanks && Object.keys(response.blanks).length) {
      const blanksDisplay = Object.entries(response.blanks)
        .map(([blankKey, blankValue]) => {
          const label = blankKey.replace(/[^0-9]/g, '');
          return `Blank ${label || blankKey}: ${blankValue}`;
        })
        .join('; ');
      summaries.push({
        label: 'Filled blanks',
        value: blanksDisplay,
      });
    }

    return summaries;
  };

  if (!questionId) return null;

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 ${className}`}
    >
      <button
        type='button'
        onClick={toggleOpen}
        className='flex w-full items-center justify-between gap-2 text-left'
      >
        <div>
          <p className='text-sm font-semibold text-slate-900 dark:text-slate-100'>
            Previous Attempts
          </p>
          <p className='text-xs text-slate-500 dark:text-slate-400'>
            {totalResponses} {totalResponses === 1 ? 'attempt' : 'attempts'}
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className='h-4 w-4 text-slate-500 dark:text-slate-300' />
        ) : (
          <ChevronDown className='h-4 w-4 text-slate-500 dark:text-slate-300' />
        )}
      </button>

      {isOpen && (
        <div className='mt-5 space-y-4'>
          {loading ? (
            <div className='flex items-center justify-center'>
              <Loader2 className='h-5 w-5 animate-spin text-slate-500' />
            </div>
          ) : error ? (
            <p className='text-sm text-rose-600 dark:text-rose-300'>{error}</p>
          ) : responses.length === 0 ? (
            <p className='text-sm text-slate-500 dark:text-slate-400'>
              No attempts recorded yet.
            </p>
          ) : (
            <>
              <div className='space-y-3'>
                {responses.map((response, index) => {
                  const attemptLabel = `Attempt #${totalResponses - ((currentPage - 1) * PAGE_SIZE + index)}`;
                  const answerSummaries = getUserAnswerSummaries(response);

                  return (
                    <article
                      key={response.id}
                      className='rounded-2xl border border-slate-200 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60'
                    >
                      <div className='flex items-center justify-between gap-4'>
                        <div>
                          <p className='text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500'>
                            {attemptLabel}
                          </p>
                          <p className='text-sm font-semibold text-slate-900 dark:text-white'>
                            {questionInfo?.questionType
                              ? questionInfo.questionType.replace(/_/g, ' ')
                              : 'Previous Attempt'}
                          </p>
                          <p className='text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {formatDate(response.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${scoreBadgeClass(
                            response,
                          )}`}
                        >
                          {getScoreText(response)}
                        </span>
                      </div>

                      {answerSummaries.length > 0 && (
                        <div className='mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300'>
                          {answerSummaries.map((summary, summaryIndex) => (
                            <p
                              key={`${summary.label}-${summaryIndex}`}
                              className='space-y-0 text-xs'
                            >
                              <span className='font-semibold text-slate-700 dark:text-slate-100'>
                                {summary.label}:
                              </span>{' '}
                              <span className='text-slate-600 dark:text-slate-300 line-clamp-3'>
                                {summary.value}
                              </span>
                            </p>
                          ))}
                        </div>
                      )}
                      {onViewResponse && (
                        <button
                          type='button'
                          className='mt-3 text-xs font-medium text-blue-600 dark:text-blue-400'
                          onClick={() => onViewResponse(response)}
                        >
                          View full attempt
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className='mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400'>
                  <button
                    type='button'
                    onClick={() => fetchResponses(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className='rounded-full px-3 py-1 border border-slate-200 transition hover:border-slate-400 dark:border-slate-700'
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type='button'
                    onClick={() =>
                      fetchResponses(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className='rounded-full px-3 py-1 border border-slate-200 transition hover:border-slate-400 dark:border-slate-700'
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default InlinePreviousAttempts;
