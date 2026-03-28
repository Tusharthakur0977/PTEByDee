import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  History,
  Play,
  Zap
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import PracticeHistory from "../components/PracticeHistory";
import PracticeQuestion from "../components/PracticeQuestions";
import QuestionResponseHistory from "../components/QuestionResponseHistory";
import QuestionSidebar from "../components/QuestionSidebar";
import QuestionTypeSelector from "../components/QuestionTypeSelector";
import { mockTests } from "../data/mockPte";
import {
  getPracticeQuestions,
  getQuestionWithResponses,
} from "../services/portal";
import { PteQuestionTypeName } from "../types/pte";

// Helper functions for question transformation
const getInstructionsForQuestionType = (questionType: string): string => {
  const instructions: { [key: string]: string } = {
    READ_ALOUD:
      "Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible.",
    REPEAT_SENTENCE:
      "You will hear a sentence. Please repeat the sentence exactly as you hear it.",
    DESCRIBE_IMAGE:
      "Look at the image below. In 25 seconds, please speak into the microphone and describe in detail what the image is showing.",
    RE_TELL_LECTURE:
      "You will hear a lecture. After listening to the lecture, in 10 seconds, please speak into the microphone and retell what you have just heard from the lecture in your own words.",
    ANSWER_SHORT_QUESTION:
      "You will hear a question. Please give a simple and short answer.",
  };
  return instructions[questionType] || "Complete the question as instructed.";
};

const getPreparationTimeForQuestionType = (questionType: string): number => {
  const preparationTimes: { [key: string]: number } = {
    READ_ALOUD: 35,
    REPEAT_SENTENCE: 0,
    DESCRIBE_IMAGE: 25,
    RE_TELL_LECTURE: 10,
    ANSWER_SHORT_QUESTION: 0,
  };
  return preparationTimes[questionType] || 0;
};

const getRecordingTimeForQuestionType = (questionType: string): number => {
  const recordingTimes: { [key: string]: number } = {
    READ_ALOUD: 40,
    REPEAT_SENTENCE: 15,
    DESCRIBE_IMAGE: 40,
    RE_TELL_LECTURE: 40,
    ANSWER_SHORT_QUESTION: 10,
  };
  return recordingTimes[questionType] || 40;
};

const Portal: React.FC = () => {
  const freeTests = mockTests.filter(
    (test: { isFree: boolean }) => test.isFree,
  );
  const premiumTests = mockTests.filter(
    (test: { isFree: boolean }) => !test.isFree,
  );
  const [activeTab, setActiveTab] = React.useState<
    "practice" | "tests" | "history"
  >("practice");
  const [selectedQuestionType, setSelectedQuestionType] =
    React.useState<PteQuestionTypeName | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [practiceQuestions, setPracticeQuestions] = React.useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = React.useState(false);
  const [questionError, setQuestionError] = React.useState<string | null>(null);

  // New state for enhanced features
  const [showQuestionSidebar, setShowQuestionSidebar] = React.useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = React.useState<
    string | null
  >(null);
  const [showResponseHistory, setShowResponseHistory] = React.useState(false);
  const [selectedQuestionForPractice, setSelectedQuestionForPractice] =
    React.useState<any>(null);
  const [isLoadingSelectedQuestion, setIsLoadingSelectedQuestion] =
    React.useState(false);
  const [practiceFilters, setPracticeFilters] = React.useState({
    practiceStatus: "all" as "practiced" | "unpracticed" | "all",
    difficultyLevel: "all" as "EASY" | "MEDIUM" | "HARD" | "all",
  });

  React.useEffect(() => {
    if (selectedQuestionType) {
      fetchPracticeQuestions();
    }
  }, [selectedQuestionType]);

  React.useEffect(() => {
    if (selectedQuestionType) {
      fetchPracticeQuestions();
    }
  }, [practiceFilters]);

  const fetchPracticeQuestions = async () => {
    if (!selectedQuestionType) return;

    try {
      setIsLoadingQuestions(true);
      setQuestionError(null);

      const options: any = {
        limit: 200,
        random: true,
      };

      if (practiceFilters.difficultyLevel !== "all") {
        options.difficultyLevel = practiceFilters.difficultyLevel;
      }

      if (practiceFilters.practiceStatus !== "all") {
        options.practiceStatus = practiceFilters.practiceStatus;
      }

      const response = await getPracticeQuestions(
        selectedQuestionType,
        options,
      );
      setPracticeQuestions(response.questions);
      setCurrentQuestionIndex(0);
    } catch (error: any) {
      console.error("Error fetching practice questions:", error);
      setQuestionError(
        error.response?.data?.message || "Failed to load practice questions",
      );
      setPracticeQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleQuestionComplete = (response: any) => {
    // If we completed a selected question, go back to practice session
    if (selectedQuestionForPractice) {
      setSelectedQuestionForPractice(null);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of practice session
      setSelectedQuestionType(null);
      setCurrentQuestionIndex(0);
      setShowQuestionSidebar(false);
      setSelectedQuestionId(null);
      setShowResponseHistory(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const loadQuestionForPractice = async (questionId: string) => {
    try {
      setIsLoadingSelectedQuestion(true);
      const response = await getQuestionWithResponses(questionId);

      // Get question type from either new or old structure
      const questionData = response.question as any; // Use any to handle dynamic structure
      const questionType =
        questionData.type ||
        questionData.questionType ||
        questionData.rawQuestion?.questionType;
      const questionCode =
        questionData.questionCode || questionData.rawQuestion?.questionCode;

      // Transform the question data to match PracticeQuestion structure
      const transformedQuestion = {
        id: questionData.id,
        type: questionType as PteQuestionTypeName,
        difficultyLevel: questionData.difficultyLevel,
        title:
          questionData.title ||
          `${questionType?.replace(/_/g, " ")} - ${questionCode}`,
        instructions:
          questionData.instructions ||
          getInstructionsForQuestionType(questionType),
        content: questionData.content || {
          text:
            questionData.textContent || questionData.rawQuestion?.textContent,
          questionStatement:
            questionData.questionStatement ||
            questionData.rawQuestion?.questionStatement,
          audioUrl: questionData.audioUrl || questionData.rawQuestion?.audioUrl,
          imageUrl: questionData.imageUrl || questionData.rawQuestion?.imageUrl,
          options: questionData.options || questionData.rawQuestion?.options,
          paragraphs: questionData.content?.paragraphs,
          blanks: questionData.content?.blanks,
          timeLimit:
            questionData.content?.timeLimit ||
            (questionType === "SUMMARIZE_SPOKEN_TEXT" ||
            questionType === "SUMMARIZE_WRITTEN_TEXT"
              ? 600 // 10 minutes for summarize spoken text and summarize written text
              : questionType === "WRITE_ESSAY"
                ? 1200 // 20 minutes for write essay
                : Math.floor(
                    (questionData.durationMillis ||
                      questionData.rawQuestion?.durationMillis ||
                      300000) / 1000,
                  )),
          preparationTime: getPreparationTimeForQuestionType(questionType),
          recordingTime: getRecordingTimeForQuestionType(questionType),
          wordLimit:
            questionData.content?.wordLimit ||
            (questionData.wordCountMin && questionData.wordCountMax
              ? {
                  min: questionData.wordCountMin,
                  max: questionData.wordCountMax,
                }
              : undefined),
        },
        questionCode: questionCode,
      };

      setSelectedQuestionForPractice(transformedQuestion);
      setShowQuestionSidebar(false);
      setShowResponseHistory(false);
      setSelectedQuestionId(null);
    } catch (error: any) {
      console.error("Error loading question for practice:", error);
      setQuestionError(
        error.response?.data?.message || "Failed to load question",
      );
    } finally {
      setIsLoadingSelectedQuestion(false);
    }
  };

  const handleQuestionSelect = (
    questionId: string,
    action: "practice" | "history" = "history",
  ) => {
    if (action === "practice") {
      loadQuestionForPractice(questionId);
    } else {
      setSelectedQuestionId(questionId);
      setShowResponseHistory(true);
      setShowQuestionSidebar(false);
      setSelectedQuestionForPractice(null);
    }
  };

  const handleFilterChange = (filters: {
    practiceStatus: "practiced" | "unpracticed" | "all";
    difficultyLevel: "EASY" | "MEDIUM" | "HARD" | "all";
  }) => {
    setPracticeFilters(filters);
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case "practice": {
        if (!selectedQuestionType) {
          return (
            <div className="relative">
              <QuestionTypeSelector
                selectedType={selectedQuestionType}
                onTypeSelect={(type) => {
                  setSelectedQuestionType(type);
                  setShowQuestionSidebar(false);
                  setSelectedQuestionId(null);
                  setShowResponseHistory(false);
                  setSelectedQuestionForPractice(null);
                }}
              />
            </div>
          );
        }

        if (showResponseHistory && selectedQuestionId) {
          return (
            <div className="relative">
              <QuestionResponseHistory
                questionId={selectedQuestionId}
                onClose={() => {
                  setShowResponseHistory(false);
                  setSelectedQuestionId(null);
                }}
              />
            </div>
          );
        }

        if (isLoadingQuestions) {
          return (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Loading Questions
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Fetching practice questions for{" "}
                {selectedQuestionType?.replace(/_/g, " ").toLowerCase()}...
              </p>
            </div>
          );
        }

        if (questionError) {
          return (
            <div className="text-center py-8">
              <div className="text-red-400 dark:text-red-500 mb-4">
                <BookOpen className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Questions
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {questionError}
              </p>
              <div className="space-x-4">
                <button
                  onClick={fetchPracticeQuestions}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setSelectedQuestionType(null)}
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Back to Question Types
                </button>
              </div>
            </div>
          );
        }

        if (practiceQuestions.length === 0) {
          return (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-4">
                <BookOpen className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No questions available
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                No practice questions match your current filters for this
                question type.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => {
                    setPracticeFilters({
                      practiceStatus: "all",
                      difficultyLevel: "all",
                    });
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setSelectedQuestionType(null)}
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Back to Question Types
                </button>
              </div>
            </div>
          );
        }

        // Determine which question to show
        const questionToShow =
          selectedQuestionForPractice ||
          practiceQuestions[currentQuestionIndex];
        const isShowingSelectedQuestion = !!selectedQuestionForPractice;

        if (isLoadingSelectedQuestion) {
          return (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading question...
                </p>
              </div>
            </div>
          );
        }

        if (!questionToShow) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No question available
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
              <button
                onClick={() => {
                  if (isShowingSelectedQuestion) {
                    setSelectedQuestionForPractice(null);
                  } else {
                    setSelectedQuestionType(null);
                    setShowQuestionSidebar(false);
                    setSelectedQuestionId(null);
                    setShowResponseHistory(false);
                  }
                }}
                className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                <span>
                  {isShowingSelectedQuestion
                    ? "Back to Practice Session"
                    : "Back to Question Types"}
                </span>
              </button>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                {/* Filters */}
                <div className="flex items-center space-x-2">
                  <select
                    value={practiceFilters.practiceStatus}
                    onChange={(e) =>
                      handleFilterChange({
                        ...practiceFilters,
                        practiceStatus: e.target.value as any,
                      })
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="all">All</option>
                    <option value="practiced">Practiced</option>
                    <option value="unpracticed">New</option>
                  </select>
                  <select
                    value={practiceFilters.difficultyLevel}
                    onChange={(e) =>
                      handleFilterChange({
                        ...practiceFilters,
                        difficultyLevel: e.target.value as any,
                      })
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="all">All Levels</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowQuestionSidebar(true)}
                  className="inline-flex items-center space-x-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>All Questions</span>
                </button>

                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {isShowingSelectedQuestion ? (
                    <span>
                      Selected Question: {questionToShow.questionCode}
                    </span>
                  ) : (
                    <span>
                      Question {currentQuestionIndex + 1} of{" "}
                      {practiceQuestions.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <PracticeQuestion
              question={questionToShow}
              onComplete={handleQuestionComplete}
              onNext={
                isShowingSelectedQuestion ? undefined : handleNextQuestion
              }
              onPrevious={
                isShowingSelectedQuestion ? undefined : handlePreviousQuestion
              }
              hasPrevious={
                !isShowingSelectedQuestion && currentQuestionIndex > 0
              }
              hasNext={
                !isShowingSelectedQuestion &&
                currentQuestionIndex < practiceQuestions.length - 1
              }
            />
          </div>
        );
      }

      case "history":
        return <PracticeHistory />;

      case "tests":
        return renderTestsContent();

      default:
        return <PracticeHistory />;
    }
  };

  const renderTestsContent = () => (
    <div className="space-y-6">
      {/* Available Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Free Tests */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Free Practice Tests
            </h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              Free Access
            </span>
          </div>
          <div className="space-y-4">
            {freeTests.map((test) => (
              <div
                key={test.id}
                className="rounded-2xl border border-slate-200 p-5 transition-colors duration-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
                      {test.title}
                    </h3>
                    <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                      {test.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{test.totalDuration} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{test.questions.length} questions</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/portal/test/${test.id}/instructions`}
                    className="flex items-center space-x-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    <Play className="h-4 w-4" />
                    <span>Start Test</span>
                  </Link>
                  <Link
                    to={`/portal/test/${test.id}/results`}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    View Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Tests */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Premium Tests
            </h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
              Premium Only
            </span>
          </div>
          <div className="space-y-4">
            {premiumTests.map((test) => (
              <div
                key={test.id}
                className="relative overflow-hidden rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/[0.03] to-blue-500/[0.06] dark:from-white/[0.02] dark:to-blue-400/[0.06]"></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
                        {test.title}
                      </h3>
                      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                        {test.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{test.totalDuration} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>Advanced Level</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Premium Features
                      </span>
                    </div>
                    <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                      Upgrade to Access
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Upgrade Card */}
            <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-5 text-white">
              <h3 className="font-semibold mb-2">Unlock Premium Tests</h3>
              <p className="mb-3 text-sm text-slate-300">
                Get access to advanced practice tests, detailed analytics, and
                personalized feedback.
              </p>
              <ul className="mb-3 space-y-1 text-sm text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3" />
                  <span>20+ Premium Practice Tests</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3" />
                  <span>Detailed Performance Analytics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3" />
                  <span>AI-Powered Feedback</span>
                </li>
              </ul>
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors duration-200 hover:bg-slate-100">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Practice, test, and review in one focused portal.
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                Targeted practice, mock tests, and history without distractions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <button
                onClick={() => setActiveTab("practice")}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "practice"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>Practice</span>
              </button>
              {/* <button
                onClick={() => setActiveTab("tests")}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "tests"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Mock Tests</span>
              </button> */}
              <button
                onClick={() => setActiveTab("history")}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "history"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl">{renderTabContent()}</div>
      </div>

      {/* Question Sidebar */}
      {selectedQuestionType && (
        <QuestionSidebar
          isOpen={showQuestionSidebar}
          onClose={() => setShowQuestionSidebar(false)}
          questionType={selectedQuestionType}
          selectedQuestionId={selectedQuestionId!}
          onQuestionSelect={handleQuestionSelect}
          practiceStatus={practiceFilters.practiceStatus}
          difficultyLevel={practiceFilters.difficultyLevel}
          onFilterChange={handleFilterChange}
        />
      )}
    </div>
  );
};

export default Portal;
