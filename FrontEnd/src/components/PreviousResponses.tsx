import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquareText,
  Volume2,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  getQuestionPreviousResponses,
  PreviousResponse,
} from "../services/questionResponse";

interface PreviousResponsesProps {
  questionId: string;
  onViewResponse: (response: PreviousResponse) => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const PAGE_SIZE = 100;

const PreviousResponses: React.FC<PreviousResponsesProps> = ({
  questionId,
  onViewResponse,
  isOpen,
  onClose,
  className = "",
}) => {
  const [responses, setResponses] = useState<PreviousResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResponses, setTotalResponses] = useState(0);
  const [questionType, setQuestionType] = useState<string>("");
  const [loadedQuestionId, setLoadedQuestionId] = useState<
    string | undefined
  >();

  const fetchData = async (page = 1, qId = questionId) => {
    if (!qId) return;

    try {
      setLoading(true);
      setError(null);

      const responsesData = await getQuestionPreviousResponses(qId, {
        page,
        limit: PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setResponses(responsesData.responses);
      setQuestionType(responsesData.question.questionType);
      setCurrentPage(responsesData.pagination.currentPage);
      setTotalPages(responsesData.pagination.totalPages);
      setTotalResponses(responsesData.pagination.totalResponses);
      setLoadedQuestionId(qId);
    } catch (err: any) {
      setError(err.message || "Failed to load previous responses");
      console.error("Error fetching previous responses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle modal open/close and question changes
  useEffect(() => {
    if (!isOpen) {
      // Reset everything when modal closes
      setLoadedQuestionId(undefined);
      return;
    }

    // Modal is open - always fetch fresh data when opening
    if (questionId) {
      setResponses([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalResponses(0);
      setError(null);
      setLoading(true);
      fetchData(1, questionId);
    }
  }, [isOpen, questionId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isAudioQuestion = () =>
    [
      "READ_ALOUD",
      "REPEAT_SENTENCE",
      "DESCRIBE_IMAGE",
      "RE_TELL_LECTURE",
      "ANSWER_SHORT_QUESTION",
      "SUMMARIZE_SPOKEN_TEXT",
      "SUMMARIZE_GROUP_DISCUSSION",
      "RESPOND_TO_A_SITUATION",
    ].includes(questionType);

  const getScoreAndMax = (response: PreviousResponse) => {
    const score = response.questionScore ?? 0;
    const analysis = response.detailedAnalysis;

    if (analysis?.scores && typeof analysis.scores === "object") {
      const max = Object.values(analysis.scores).reduce(
        (sum: number, s: any) => sum + (s?.max || 0),
        0,
      );
      return { score, max };
    }

    return { score, max: 0 };
  };

  const getScoreDisplay = (response: PreviousResponse) => {
    const { score, max } = getScoreAndMax(response);
    return max > 0 ? `${score}/${max}` : score > 0 ? `${score}` : "";
  };

  const getScoreBadgeStyle = (response: PreviousResponse) => {
    const { score, max } = getScoreAndMax(response);
    const percentage = max > 0 ? (score / max) * 100 : 0;

    if (percentage >= 80) {
      return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
    }
    if (percentage >= 60) {
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
    }
    if (percentage >= 40) {
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
    }

    return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300";
  };

  const getAttemptLabel = (indexOnPage: number) => {
    const absoluteIndex = (currentPage - 1) * PAGE_SIZE + indexOnPage;
    const attemptNumber = totalResponses - absoluteIndex;
    return `Attempt #${Math.max(attemptNumber, 1)}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      <div
        className={`fixed right-0 top-0 h-full w-[50%] lg:w-[52%] bg-white dark:bg-gray-800 shadow-xl z-[60] flex flex-col border-l border-gray-200 dark:border-gray-700 ${className}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Previous Attempts
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalResponses} {totalResponses === 1 ? "attempt" : "attempts"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              Loading attempts...
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => fetchData(currentPage)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded"
            >
              Retry
            </button>
          </div>
        ) : responses.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <MessageSquareText className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              No previous attempts yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Complete this question once and your attempts will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 p-4">
              {responses.map((response, index) => {
                const scoreDisplay = getScoreDisplay(response);

                return (
                  <div
                    key={response.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/60 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {getAttemptLabel(index)}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(response.createdAt)}</span>
                        </div>
                      </div>

                      {scoreDisplay && (
                        <p
                          className={`px-3 py-1 text-xs rounded-md font-semibold whitespace-nowrap ${getScoreBadgeStyle(
                            response,
                          )}`}
                        >
                          {scoreDisplay}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-1 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {isAudioQuestion() && response.audioResponseUrl ? (
                          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                            <Volume2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <audio
                              controls
                              src={response.audioResponseUrl}
                              className="h-7 w-full"
                              preload="metadata"
                            />
                          </div>
                        ) : (
                          <div className="px-2 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-gray-700 dark:text-gray-200 line-clamp-2">
                              {response.textResponse || "No response data"}
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onViewResponse(response)}
                        className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shrink-0 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between text-xs">
                <button
                  onClick={() => fetchData(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => fetchData(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
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
