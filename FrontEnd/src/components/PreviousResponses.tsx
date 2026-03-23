import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader,
  Volume2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  getQuestionPreviousResponses,
  getQuestionResponseStats,
  PreviousResponse,
} from '../services/questionResponse';

interface PreviousResponsesProps {
  questionId: string;
  onViewResponse: (response: PreviousResponse) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const PreviousResponses: React.FC<PreviousResponsesProps> = ({
  questionId,
  onViewResponse,
  isOpen,
  onClose,
  className = '',
}) => {
  const [responses, setResponses] = useState<PreviousResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResponses, setTotalResponses] = useState(0);
  const [questionType, setQuestionType] = useState<string>('');

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const [responsesData] = await Promise.all([
        getQuestionPreviousResponses(questionId, {
          page,
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        getQuestionResponseStats(questionId),
      ]);

      setResponses(responsesData.responses);
      setQuestionType(responsesData.question.questionType);
      setCurrentPage(responsesData.pagination.currentPage);
      setTotalPages(responsesData.pagination.totalPages);
      setTotalResponses(responsesData.pagination.totalResponses);
    } catch (err: any) {
      setError(err.message || 'Failed to load previous responses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && questionId) fetchData(1);
  }, [isOpen, questionId]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const isAudioQuestion = () =>
    [
      'READ_ALOUD',
      'REPEAT_SENTENCE',
      'DESCRIBE_IMAGE',
      'RE_TELL_LECTURE',
      'ANSWER_SHORT_QUESTION',
      'SUMMARIZE_SPOKEN_TEXT',
    ].includes(questionType);

  const getScoreAndMax = (r: PreviousResponse) => {
    if (!r.detailedAnalysis) return { score: r.questionScore || 0, max: 0 };
    const a = r.detailedAnalysis;
    const score =
      (a.contentScore || 0) +
      (a.pronunciationScore || 0) +
      (a.fluencyScore || a.oralFluencyScore || 0);
    const max =
      (a.contentMaxScore || 5) +
      (a.pronunciationMaxScore || 5) +
      (a.fluencyMaxScore || a.oralFluencyMaxScore || 5);
    return { score, max };
  };

  const getScoreDisplay = (r: PreviousResponse) => {
    const { score, max } = getScoreAndMax(r);
    return max > 0 ? `${score}/${max}` : score > 0 ? `${score}` : '';
  };

  const getScoreBgColor = (r: PreviousResponse) => {
    const { score, max } = getScoreAndMax(r);
    const p = max > 0 ? (score / max) * 100 : 0;
    if (p >= 80)
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
    if (p >= 60)
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    if (p >= 40)
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300';
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className='fixed inset-0 bg-black/50 z-50'
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 h-full w-[50%] bg-white dark:bg-gray-800 shadow-xl z-[60] flex flex-col ${className}`}
      >
        <div className='flex items-center justify-between px-4 py-3 border-b dark:border-gray-700'>
          <div>
            <h3 className='text-base font-semibold'>Previous Attempts</h3>
            <p className='text-xs text-gray-500'>
              {totalResponses} {totalResponses === 1 ? 'attempt' : 'attempts'}
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {loading ? (
          <div className='flex-1 flex items-center justify-center'>
            <Loader className='h-5 w-5 animate-spin text-blue-600' />
          </div>
        ) : error ? (
          <div className='flex-1 flex items-center justify-center text-red-600'>
            <AlertCircle className='h-5 w-5' />
          </div>
        ) : (
          <>
            <div className='flex-1 overflow-y-auto space-y-3 p-4'>
              {responses.map((r, i) => {
                const attempt = (currentPage - 1) * 5 + i + 1;
                const score = getScoreDisplay(r);

                return (
                  <div
                    key={r.id}
                    className='rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900'
                  >
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-2'>
                        <div className='w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center'>
                          <span className='text-[10px] font-bold text-white'>
                            {attempt}
                          </span>
                        </div>
                        <div className='flex items-center gap-1 text-xs text-gray-500'>
                          <Calendar className='h-3 w-3' />
                          <span>{formatDate(r.createdAt)}</span>
                        </div>
                      </div>
                      {score && (
                        <p
                          className={`px-4 py-1.5 text-sm rounded-lg font-semibold ${getScoreBgColor(
                            r,
                          )}`}
                        >
                          {score}
                        </p>
                      )}
                    </div>

                    <div className='flex items-center gap-3 flex-1 flex-wrap'>
                      <div className='flex'>
                        {isAudioQuestion() && r.audioResponseUrl ? (
                          <div className='flex items-center gap-2 px-2 py-1.5 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50'>
                            <Volume2 className='h-3.5 w-3.5 text-blue-600' />
                            <audio
                              controls
                              src={r.audioResponseUrl}
                              className='h-5 flex-1'
                              preload='metadata'
                            />
                          </div>
                        ) : (
                          <div className='px-2 py-1.5 rounded bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'>
                            <p className='text-xs'>
                              {r.textResponse || 'No response data'}
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onViewResponse(r)}
                        className='px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded'
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className='px-4 py-2 border-t mb-4 dark:border-gray-700 flex items-center justify-between text-xs'>
                <button
                  onClick={() => fetchData(currentPage - 1)}
                  disabled={currentPage === 1}
                  className='flex items-center bg-blue-500 gap-1 px-5 text-white text-base py-2 border rounded-lg disabled:opacity-40'
                >
                  <ChevronLeft className='h-4 w-4' />
                  Prev
                </button>

                <span className='text-gray-500'>
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => fetchData(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className='flex items-center bg-blue-500 gap-1 px-5 text-white text-base py-2 border rounded-lg disabled:opacity-40'
                >
                  Next
                  <ChevronRight className='h-4 w-4' />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default PreviousResponses;
