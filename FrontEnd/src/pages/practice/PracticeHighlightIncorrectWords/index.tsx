import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  Info,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MiniAudioPlayer from "../../../components/MiniAudioPlayer";
import PreviousResponses from "../../../components/PreviousResponses";
import QuestionSidebar from "../../../components/QuestionSidebar";
import ResponseDetailModal from "./ResponseDetailModal";
import api from "../../../services/api";
import { getPracticeQuestions } from "../../../services/portal";
import { PteQuestionTypeName } from "../../../types/pte";
import { formatScoringText } from "../../../utils/Helpers";

export interface QuestionsData {
  id: string;
  type: string;
  difficultyLevel: string;
  title: string;
  instructions: string;
  hasUserResponses: boolean;
  content: Content;
}

export interface Content {
  text: string;
  audioUrl: any;
  imageUrl: string;
  options: any[];
  blanks: any[];
  paragraphs: any[];
  timeLimit: number;
  preparationTime: number;
  recordingTime: number;
}

const PracticeHighlightIncorrectWords: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionsData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionSidebar, setShowQuestionSidebar] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<
    "EASY" | "MEDIUM" | "HARD" | "all"
  >("all");
  const [showDifficultyFilter, setShowDifficultyFilter] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const evaluationRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<{
    pause: () => void;
    play: () => void;
    stop: () => void;
  } | null>(null);

  // User response
  const [response, setResponse] = useState<{
    highlightedWordIds: string[];
    highlightedWords: string[];
  }>({ highlightedWordIds: [], highlightedWords: [] });

  // Evaluation features
  const [isCompleted, setIsCompleted] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [showPreviousResponses, setShowPreviousResponses] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Audio finished state
  const [audioFinished, setAudioFinished] = useState(false);
  const [audioResetKey, setAudioResetKey] = useState(0);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const options: any = {
        limit: 100,
        random: false,
      };

      if (difficultyLevel !== "all") {
        options.difficultyLevel = difficultyLevel;
      }

      const response = await getPracticeQuestions(
        PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS,
        options,
      );
      setQuestions(response.questions as QuestionsData[]);
      setCurrentIndex(0);
    } catch (err) {
      setError("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  }, [difficultyLevel]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const currentQuestion = questions[currentIndex];

  // Reset state when question changes
  useEffect(() => {
    setIsCompleted(false);
    setResponse({ highlightedWordIds: [], highlightedWords: [] });
    setEvaluationResult(null);
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);
    setAudioFinished(false);
  }, [currentIndex]);

  useEffect(() => {
    setElapsedSeconds(0);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (isCompleted || isLoading || !currentQuestion?.id) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion?.id, isCompleted, isLoading]);

  const handleReset = () => {
    setResponse({ highlightedWordIds: [], highlightedWords: [] });
    setElapsedSeconds(0);
    setIsCompleted(false);
    setEvaluationResult(null);
    setError(null);
    setAudioFinished(false);
    // Stop current audio and reset by incrementing key
    audioRef.current?.stop();
    setAudioResetKey((prev) => prev + 1);
  };

  const handleSubmit = useCallback(async () => {
    if (isCompleted || isSubmitting) return;

    if (!response.highlightedWords || response.highlightedWords.length === 0) {
      setError("Please highlight at least one word");
      return;
    }

    try {
      setIsSubmitting(true);

      // Pause audio on submit
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const result = await api.post("/user/questions/submit-response", {
        questionId: currentQuestion?.id,
        userResponse: {
          highlightedWords: response.highlightedWords,
        },
        timeTakenSeconds: elapsedSeconds,
      });

      setEvaluationResult(result.data.data);

      setIsCompleted(true);
      // Debug: Log the response structure
      console.log("Evaluation Result:", result.data.data);
      console.log(
        "Word Mapping:",
        result.data.data?.evaluation?.detailedAnalysis?.wordMapping ||
          result.data.data?.detailedAnalysis?.wordMapping,
      );
      setTimeout(() => {
        evaluationRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err: any) {
      console.error("Error submitting response:", err);
      setError(err.message || "Failed to evaluate response");

      setEvaluationResult(null);
      setIsCompleted(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [isCompleted, isSubmitting, currentQuestion, response, elapsedSeconds]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleExit = () => {
    if (window.confirm("Are you sure you want to exit?")) {
      navigate("/portal");
    }
  };

  const handleQuestionSelect = (questionId: string) => {
    const selectedIndex = questions.findIndex((q) => q.id === questionId);
    if (selectedIndex !== -1) {
      setCurrentIndex(selectedIndex);
      setShowQuestionSidebar(false);
    }
  };

  const handleViewResponse = (response: any) => {
    setSelectedResponse(response);
    setShowResponseModal(true);
  };

  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setSelectedResponse(null);
  };

  const handleAudioEnded = () => {
    setAudioFinished(true);
  };

  const getScoreColor = (score: number, max: number): string => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/*  HEADER */}
      <div className="dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={handleExit} className="p-2" title="Exit">
            <ChevronLeft className="w-6 h-6 text-black dark:text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-black dark:text-white">
              Highlight Incorrect Words{" "}
              <p className="text-gray-400 dark:text-gray-400 text-sm">
                (Question {currentIndex + 1} of {questions.length})
              </p>
            </h1>

            <div className="flex flex-row items-center space-x-3 ">
              <p className="font-bold text-blue-600 dark:text-blue-400 text-sm leading-relaxed">
                You will hear a recording. Below is a transcription of the
                recording. Some words in the transcription differ from what the
                speaker said. Please click on the words that are different.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button
              onClick={() => setShowDifficultyFilter(!showDifficultyFilter)}
              className="p-2 text-gray-300 hover:text-white"
              title="Filter by difficulty"
            >
              <Filter className="w-4 h-4 text-gray-400 dark:text-white" />
            </button>
            {showDifficultyFilter && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg p-3 z-50">
                <p className="text-xs text-gray-400 mb-2 font-semibold">
                  Difficulty Level
                </p>
                <div className="space-y-2">
                  {(["all", "EASY", "MEDIUM", "HARD"] as const).map((level) => (
                    <label
                      key={level}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="difficulty"
                        value={level}
                        checked={difficultyLevel === level}
                        onChange={(e) => {
                          setDifficultyLevel(e.target.value as any);
                          setShowDifficultyFilter(false);
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">
                        {level === "all" ? "All Levels" : level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowQuestionSidebar(true)}
            className="p-2 text-gray-300 hover:text-white"
            title="View all questions"
          >
            <BarChart3 className="w-4 h-4 text-gray-400 dark:text-white" />
          </button>
          <button
            onClick={() => setShowPreviousResponses(true)}
            className="flex items-center gap-2 p-2 text-gray-400 text-sm font-semibold"
            title="Previous Attempts"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="h-screen dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="dark:text-white">Loading questions...</p>
          </div>
        </div>
      )}

      {questions.length === 0 && !isLoading ? (
        <div className="h-screen bg-gray-900 flex items-center justify-center">
          <p className="dark:text-white">No questions available</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto relative">
          <div className="absolute top-4 right-4 z-10 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1.5 border border-gray-200 dark:border-gray-600 shadow-sm">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              Elapsed: {formatElapsedTime(elapsedSeconds)}
            </p>
          </div>
          <div className="max-w-4xl mx-auto p-8 space-y-6">
            {/* Audio Player */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <MiniAudioPlayer
                  src={currentQuestion?.content?.audioUrl || ""}
                  title="Listen to the recording"
                  autoPlay={true}
                  autoPlayDelay={2000}
                  onEnded={handleAudioEnded}
                  key={`audio-${currentQuestion?.id}-${audioResetKey}`}
                  questionId={currentQuestion?.id}
                  questionAudioText={currentQuestion?.content?.text || ""}
                  ref={audioRef}
                />
              </div>

              {audioFinished && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    ✓ Audio finished. Select your answer below.
                  </p>
                </div>
              )}
            </div>

            {/* Highlight Words Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-lg leading-relaxed text-justify">
                {currentQuestion?.content?.text
                  ?.split(" ")
                  .map((word, index) => {
                    const wordId = `word-${index}`;
                    const highlightedWordIds =
                      response.highlightedWordIds || [];
                    const isHighlighted = highlightedWordIds.includes(wordId);

                    // Get incorrect words from evaluation result
                    // Use backend's pre-cleaned values for reliable matching
                    const cleanedIncorrectFromBackend =
                      evaluationResult?.evaluation?.detailedAnalysis
                        ?.highlightResult?.cleanedIncorrect || [];
                    const wordMapping =
                      evaluationResult?.evaluation?.detailedAnalysis
                        ?.highlightResult?.wordMapping || [];

                    // Helper function to clean words (remove punctuation)
                    const cleanWord = (w: string): string => {
                      return w.replace(/[^\w]/g, "").toLowerCase();
                    };

                    // Clean the current word and compare against cleaned incorrect words
                    const cleanedCurrentWord = cleanWord(word);
                    // Check if current word is in the backend's cleaned incorrect list
                    const isWordIncorrect =
                      cleanedIncorrectFromBackend.includes(cleanedCurrentWord);

                    // Find the correct word from word mapping
                    const wordMapEntry = wordMapping.find(
                      (mapping: any) =>
                        cleanWord(mapping.incorrect) === cleanedCurrentWord,
                    );

                    // Determine styling based on state
                    let wordClass =
                      "cursor-pointer px-1 py-0.5 rounded-md transition-all duration-200 inline";
                    let showAnswer = false;
                    let answerText = "";
                    let answerClass = "";

                    if (isCompleted) {
                      if (isHighlighted) {
                        if (isWordIncorrect) {
                          // ✅ Correct highlight - user found the incorrect word
                          wordClass +=
                            " bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 border-2 border-emerald-400 dark:border-emerald-600 font-semibold";
                          // Show answer
                          if (wordMapEntry) {
                            showAnswer = true;
                            answerText = wordMapEntry.correct;
                            answerClass =
                              "text-emerald-600 dark:text-emerald-400 text-sm font-semibold ml-1";
                          }
                        } else {
                          // ❌ Incorrect highlight - user highlighted a correct word
                          wordClass +=
                            " bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100 border-2 border-rose-400 dark:border-rose-600 font-semibold line-through";
                        }
                      } else {
                        if (isWordIncorrect) {
                          // ⚠️ Missed - should have highlighted this word
                          wordClass +=
                            " bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 border-2 border-dashed border-amber-400 dark:border-amber-600 font-semibold";
                          // Show answer
                          if (wordMapEntry) {
                            showAnswer = true;
                            answerText = wordMapEntry.correct;
                            answerClass =
                              "text-amber-600 dark:text-amber-400 text-sm font-semibold ml-1";
                          }
                        } else {
                          // ✓ Correct - not highlighted and shouldn't be
                          wordClass += " text-gray-900 dark:text-white";
                        }
                      }
                    } else {
                      // Before submission - selection phase
                      if (isHighlighted) {
                        // 🔵 Selected - show in blue
                        wordClass +=
                          " bg-blue-200 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 border-2 border-blue-500 dark:border-blue-400 font-semibold shadow-md";
                      } else {
                        // ⚪ Not selected - normal with hover effect
                        wordClass +=
                          " text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700";
                      }
                    }

                    return (
                      <span key={index}>
                        <span
                          onClick={() => {
                            if (isCompleted) return;

                            if (isHighlighted) {
                              const wordIdIndex =
                                highlightedWordIds.indexOf(wordId);
                              const newHighlightedWordIds =
                                highlightedWordIds.filter(
                                  (id: string) => id !== wordId,
                                );
                              const newHighlightedWords = (
                                response.highlightedWords || []
                              ).filter(
                                (_: any, i: number) => i !== wordIdIndex,
                              );
                              setResponse({
                                ...response,
                                highlightedWordIds: newHighlightedWordIds,
                                highlightedWords: newHighlightedWords,
                              });
                            } else {
                              setResponse({
                                ...response,
                                highlightedWordIds: [
                                  ...highlightedWordIds,
                                  wordId,
                                ],
                                highlightedWords: [
                                  ...(response.highlightedWords || []),
                                  word,
                                ],
                              });
                            }
                          }}
                          className={wordClass}
                          title={
                            isCompleted && isWordIncorrect
                              ? `Incorrect word`
                              : ""
                          }
                        >
                          {word}
                        </span>
                        {showAnswer && (
                          <span className={answerClass}>
                            (Answer: {answerText})
                          </span>
                        )}
                        {index <
                          (currentQuestion?.content?.text?.split(" ").length ||
                            0) -
                            1 && " "}
                      </span>
                    );
                  })}
              </p>
              <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                Selected words:{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {response.highlightedWords?.length || 0}
                </span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleReset}
                disabled={
                  isSubmitting || (response.highlightedWords?.length || 0) === 0
                }
                className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 font-semibold transition"
              >
                Reset
              </button>

              {!isCompleted && (
                <button
                  onClick={handleSubmit}
                  disabled={
                    (response.highlightedWords?.length || 0) === 0 ||
                    isSubmitting
                  }
                  className="flex-1 sm:flex-none sm:w-[60%] bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-md transition"
                >
                  {isSubmitting ? "Submitting..." : "Submit Answer"}
                </button>
              )}
            </div>

            {/* Evaluation Results Section */}
            {evaluationResult?.evaluation && (
              <div
                ref={evaluationRef}
                className="flex flex-1 flex-col overflow-auto px-6 py-8 gap-5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white px-1">
                  Detailed Analysis
                </h3>

                {/* Scoring Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Rubric
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {Object.entries(
                        evaluationResult.evaluation.detailedAnalysis.scores ||
                          {},
                      ).map(([component, scoreData]: any) => (
                        <tr
                          key={component}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700 dark:text-gray-200">
                                {formatScoringText(component)}
                              </span>
                              <div className="relative group inline-flex items-center">
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />

                                {/* Tooltip */}
                                <div className="absolute left-full top-1/2 ml-3 -translate-y-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl hidden group-hover:block z-50">
                                  <p className="font-bold mb-1">
                                    Scoring Criteria
                                  </p>
                                  <p className="mb-1">
                                    Your response for Highlight Incorrect Words
                                    is judged on your ability to listen for –
                                    and to point out – the differences between a
                                    recording and a transcription.
                                  </p>

                                  <p>
                                    Each selected word is scored as either
                                    correct or incorrect. If all the selected
                                    words are correct, you receive the maximum
                                    score points for this question type. If one
                                    or more selected words are incorrect,
                                    partial credit scoring applies.
                                  </p>

                                  {/* Arrow */}
                                  <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full 
                    border-8 border-transparent border-r-gray-900"
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <span
                              className={`text-lg font-bold ${getScoreColor(
                                scoreData.score || 0,
                                scoreData.max || 10,
                              )}`}
                            >
                              {scoreData.score}
                              <span className="text-gray-400 font-medium">
                                /{scoreData.max}
                              </span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Score Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Your Score:{" "}
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {evaluationResult.evaluation.score.scored}
                    </span>
                    {evaluationResult.evaluation.detailedAnalysis?.scores && (
                      <span className="ml-2 text-gray-500 dark:text-gray-400">
                        /{" "}
                        {Object.values(
                          evaluationResult.evaluation.detailedAnalysis.scores,
                        ).reduce(
                          (sum: number, score: any) => sum + score.max,
                          0,
                        )}{" "}
                        points
                      </span>
                    )}
                  </h4>
                </div>

                {/* Explanation */}
                {evaluationResult?.evaluation?.detailedAnalysis
                  ?.explanation && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-blue-100 dark:border-blue-800 flex items-center gap-2">
                      <span className="text-xl">📘</span>
                      <h4 className="font-bold text-blue-900 dark:text-blue-200 text-lg">
                        Answer Explanation
                      </h4>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {evaluationResult.evaluation.detailedAnalysis.explanation}
                    </div>
                  </div>
                )}

                {/* Answer Analysis - Show Correct vs Selected Options */}
                {evaluationResult?.evaluation?.detailedAnalysis && (
                  <div className="space-y-4">
                    {/* Correct Answers */}
                    {evaluationResult.evaluation.detailedAnalysis
                      .correctOptionTexts && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800 overflow-hidden">
                        <div className="px-6 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                          <h4 className="font-semibold text-green-900 dark:text-green-300">
                            ✓ Correct Answers (
                            {
                              evaluationResult.evaluation.detailedAnalysis
                                .correctOptionTexts.length
                            }
                            )
                          </h4>
                        </div>
                        <div className="p-6 space-y-3">
                          {evaluationResult.evaluation.detailedAnalysis.correctOptionTexts.map(
                            (text: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500">
                                    <svg
                                      className="h-3 w-3 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {text}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Incorrectly Selected */}
                    {evaluationResult.evaluation.detailedAnalysis
                      .incorrectlySelectedTexts &&
                      evaluationResult.evaluation.detailedAnalysis
                        .incorrectlySelectedTexts.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 overflow-hidden">
                          <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                            <h4 className="font-semibold text-red-900 dark:text-red-300">
                              ✗ Incorrectly Selected (
                              {
                                evaluationResult.evaluation.detailedAnalysis
                                  .incorrectlySelectedTexts.length
                              }
                              )
                            </h4>
                          </div>
                          <div className="p-6 space-y-3">
                            {evaluationResult.evaluation.detailedAnalysis.incorrectlySelectedTexts.map(
                              (text: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3"
                                >
                                  <div className="flex-shrink-0 mt-1">
                                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-500">
                                      <svg
                                        className="h-3 w-3 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {text}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Missed Correct Answers */}
                    {evaluationResult.evaluation.detailedAnalysis
                      .missedCorrectTexts &&
                      evaluationResult.evaluation.detailedAnalysis
                        .missedCorrectTexts.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-800 overflow-hidden">
                          <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300">
                              ⊘ Missed Correct Answers (
                              {
                                evaluationResult.evaluation.detailedAnalysis
                                  .missedCorrectTexts.length
                              }
                              )
                            </h4>
                          </div>
                          <div className="p-6 space-y-3">
                            {evaluationResult.evaluation.detailedAnalysis.missedCorrectTexts.map(
                              (text: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3"
                                >
                                  <div className="flex-shrink-0 mt-1">
                                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-yellow-500">
                                      <svg
                                        className="h-3 w-3 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {text}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4 flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <span className="text-gray-400 text-sm">
          {currentIndex + 1} / {questions.length}
        </span>

        <button
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Question Sidebar */}
      <QuestionSidebar
        isOpen={showQuestionSidebar}
        onClose={() => setShowQuestionSidebar(false)}
        questionType={PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS}
        selectedQuestionId={currentQuestion?.id}
        onQuestionSelect={handleQuestionSelect}
        practiceStatus="all"
        difficultyLevel={difficultyLevel}
        onFilterChange={(filters) => {
          setDifficultyLevel(filters.difficultyLevel);
        }}
      />

      {/* Previous Attempts Modal Drawer */}
      <PreviousResponses
        questionId={currentQuestion?.id}
        onViewResponse={handleViewResponse}
        isOpen={showPreviousResponses}
        onClose={() => setShowPreviousResponses(false)}
      />

      {/* Response Detail Modal */}
      <ResponseDetailModal
        response={selectedResponse}
        isOpen={showResponseModal}
        onClose={handleCloseResponseModal}
        questionType={PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS}
      />
    </div>
  );
};

export default PracticeHighlightIncorrectWords;

export interface Data {
  responseId: string;
  evaluation: Evaluation;
  question: Question;
  timeTaken: number;
  transcribedText: any;
}

export interface Evaluation {
  score: { scored: number; max: number };
  isCorrect: boolean;
  feedback: string;
  detailedAnalysis: DetailedAnalysis;
  suggestions: string[];
}

export interface DetailedAnalysis {
  scores: Scores;
  highlightResult?: {
    highlightedWords: string[];
    incorrectWords: string[];
    cleanedHighlighted: string[];
    cleanedIncorrect: string[];
    correctHighlights: number;
    incorrectHighlights: number;
    wordMapping: WordMapping[];
  };
}

export interface WordMapping {
  correct: string;
  incorrect: string;
  wasHighlighted: boolean;
}

export interface Scores {
  listening: Listening;
}

export interface Listening {
  score: number;
  max: number;
}

export interface Question {
  id: string;
  questionCode: string;
  questionType: string;
  sectionName: string;
}
