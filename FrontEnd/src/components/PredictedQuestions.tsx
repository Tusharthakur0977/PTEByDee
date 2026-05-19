import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Flame,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Target,
  BookOpen,
  Eye,
  Headphones,
  Mic,
  PenTool,
  Volume2,
  MessageSquare,
  FileText,
  Edit3,
  CheckSquare,
  RotateCcw,
  Search,
  Type,
  HelpCircle,
  Trophy,
  Sparkles,
  MousePointer,
} from 'lucide-react';
import { getQuestionTypes, getPredictedQuestions } from '../services/portal';
import { getPracticePagePath } from '../utils/questionTypeToSlug';
import { questionTypeOrder, sectionOrder } from '../utils/questionOrdering';

interface SelectedTypeState {
  name: string;
  title: string;
  color: string;
  icon: any;
  questions: any[];
}



const PredictedQuestions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionTypesGrouped, setQuestionTypesGrouped] = useState<any>({});
  const [predictedGrouped, setPredictedGrouped] = useState<any>({});
  const [selectedType, setSelectedType] = useState<SelectedTypeState | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType]);

  useEffect(() => {
    fetchData();
  }, []);

  // Synchronize selected question type from route search parameters (?type=TYPE)
  useEffect(() => {
    if (loading || Object.keys(questionTypesGrouped).length === 0) return;

    const queryType = new URLSearchParams(location.search).get('type');
    if (queryType) {
      const parts = queryType.split('/');
      const typeName = parts[0];
      const questionId = parts[1] || null;

      if (questionId) {
        // Backwards compatibility: redirect old inline format to new standalone full-screen format!
        navigate(`/practiceQuestion/${typeName}/${questionId}`, {
          replace: true,
        });
        return;
      }

      let foundType: any = null;
      for (const [sectionName, sectionData] of Object.entries(
        questionTypesGrouped,
      )) {
        const types = (sectionData as any).questionTypes || [];
        const match = types.find((t: any) => t.name === typeName);
        if (match) {
          const typePredicted = predictedGrouped[match.name] || {
            questions: [],
            count: 0,
          };
          const categoryColor = getSectionColor(sectionName);
          foundType = {
            name: match.name,
            title: match.name
              .split('_')
              .map(
                (w: string) =>
                  w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
              )
              .join(' '),
            color: categoryColor,
            icon: getQuestionTypeIcon(match.name),
            questions: typePredicted.questions,
          };
          break;
        }
      }

      if (foundType) {
        setSelectedType(foundType);
      } else {
        setSelectedType(null);
      }
    } else {
      setSelectedType(null);
    }
  }, [location.search, loading, questionTypesGrouped, predictedGrouped]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both standard question types (categories structure) and predicted questions
      const [typesData, predictedData] = await Promise.all([
        getQuestionTypes(),
        getPredictedQuestions(),
      ]);

      setQuestionTypesGrouped(typesData.groupedBySection || {});
      setPredictedGrouped(predictedData.groupedByType || {});
    } catch (err: any) {
      console.error('Error fetching predicted questions data:', err);
      setError('Failed to load predicted questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSectionIcon = (name: string) => {
    if (name.includes('Speaking')) return Mic;
    if (name.includes('Writing')) return PenTool;
    if (name.includes('Reading')) return Eye;
    if (name.includes('Listening')) return Headphones;
    return BookOpen;
  };

  const getSectionColor = (name: string) => {
    if (name.includes('Speaking')) return 'red';
    if (name.includes('Writing')) return 'blue';
    if (name.includes('Reading')) return 'green';
    if (name.includes('Listening')) return 'purple';
    return 'gray';
  };

  const getQuestionTypeIcon = (typeName: string) => {
    const iconMap: { [key: string]: any } = {
      read_aloud: BookOpen,
      repeat_sentence: Volume2,
      describe_image: Eye,
      re_tell_lecture: MessageSquare,
      answer_short_question: MessageSquare,
      summarize_written_text: FileText,
      write_essay: Edit3,
      fill_in_the_blanks_drag_and_drop: Edit3,
      multiple_choice_multiple_answers_reading: CheckSquare,
      re_order_paragraphs: RotateCcw,
      reading_fill_in_the_blanks: Search,
      multiple_choice_single_answer_reading: MousePointer,
      summarize_spoken_text: FileText,
      multiple_choice_multiple_answers_listening: CheckSquare,
      listening_fill_in_the_blanks: Type,
      highlight_correct_summary: Search,
      multiple_choice_single_answer_listening: MousePointer,
      select_missing_word: Volume2,
      highlight_incorrect_words: Search,
      write_from_dictation: Type,
    };

    return iconMap[typeName.toLowerCase()] || FileText;
  };

  const getColorClasses = (
    color: string,
    variant: 'bg' | 'text' | 'border' | 'hover',
  ) => {
    const colorMap = {
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
      },
    };
    return colorMap[color as keyof typeof colorMap]?.[variant] || '';
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'HARD':
        return 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900';
      case 'MEDIUM':
        return 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900';
      case 'EASY':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900';
    }
  };

  const handleQuestionSelect = (q: any) => {
    if (!selectedType) return;
    sessionStorage.setItem('activeQuestionId', q.id);
    navigate(`/practiceQuestion/${selectedType.name}/${q.id}`);
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-24'>
        <Loader2 className='h-10 w-10 animate-spin text-orange-500 mb-4' />
        <p className='text-slate-600 dark:text-slate-400 font-medium'>
          Loading predicted questions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-16 max-w-md mx-auto'>
        <HelpCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
        <h3 className='text-xl font-bold text-slate-900 dark:text-white mb-2'>
          Failed to load
        </h3>
        <p className='text-slate-500 dark:text-slate-400 mb-6'>{error}</p>
        <button
          onClick={fetchData}
          className='px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20'
        >
          Try Again
        </button>
      </div>
    );
  }

  // Map and sort sections
  const sections = Object.entries(questionTypesGrouped)
    .sort(([sectionNameA], [sectionNameB]) => {
      const indexA = sectionOrder.indexOf(sectionNameA);
      const indexB = sectionOrder.indexOf(sectionNameB);
      if (indexA === -1 && indexB === -1)
        return sectionNameA.localeCompare(sectionNameB);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    })
    .map(([sectionName, sectionData]: [string, any]) => {
      const color = getSectionColor(sectionName);

      const sortedTypes = [...sectionData.questionTypes]
        .sort((a: any, b: any) => {
          const orderA = questionTypeOrder[a.name.toLowerCase()] ?? 999;
          const orderB = questionTypeOrder[b.name.toLowerCase()] ?? 999;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        })
        .map((qt: any) => {
          const typePredicted = predictedGrouped[qt.name] || {
            questions: [],
            count: 0,
          };
          return {
            name: qt.name,
            title: qt.name
              .split('_')
              .map(
                (w: string) =>
                  w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
              )
              .join(' '),
            icon: getQuestionTypeIcon(qt.name),
            predictedCount: typePredicted.questions.length,
            questions: typePredicted.questions,
          };
        });

      return {
        id: sectionName.toLowerCase().replace(/\s+/g, '-'),
        title: sectionName,
        icon: getSectionIcon(sectionName),
        color,
        description:
          sectionData.section.description ||
          ` Curated predicted questions for ${sectionName.toLowerCase()}`,
        types: sortedTypes,
      };
    });

  // Calculate total predicted questions
  const totalPredicted = Object.values(predictedGrouped).reduce(
    (acc: number, item: any) => {
      return acc + (item?.questions?.length || 0);
    },
    0,
  );

  // If a specific question type is clicked, show its list
  if (selectedType) {
    const QuestionIcon = selectedType.icon;

    return (
      <div className='space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300'>
        {/* Detail Header */}
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => navigate('/portal/prediction')}
              className='p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm'
              aria-label='Back to categories'
            >
              <ArrowLeft className='h-5 w-5' />
            </button>
            <div className='flex items-center gap-3'>
              <div
                className={`${getColorClasses(selectedType.color, 'bg')} p-3 rounded-2xl border ${getColorClasses(selectedType.color, 'border')}`}
              >
                <QuestionIcon
                  className={`h-6 w-6 ${getColorClasses(selectedType.color, 'text')}`}
                />
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
                    {selectedType.title}
                  </h2>
                  <span className='px-2.5 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 rounded-full border border-orange-200 dark:border-orange-900'>
                    🔥 Predicted
                  </span>
                </div>
                <p className='text-sm text-slate-500 dark:text-slate-400 mt-0.5'>
                  Curated questions with a high probability of appearing in your
                  upcoming exams.
                </p>
              </div>
            </div>
          </div>

          <div className='px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl w-fit'>
            {selectedType.questions.length} Questions Available
          </div>
        </div>

        {/* Questions List */}
        {selectedType.questions.length === 0 ? (
          <div className='text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed'>
            <Target className='h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
              No predicted questions
            </h3>
            <p className='text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto'>
              We are still curating predicted questions for this section. Check
              back soon!
            </p>
            <button
              onClick={() => navigate('/portal/prediction')}
              className='mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-800 dark:text-white rounded-xl text-sm font-semibold transition-colors'
            >
              Back to Sections
            </button>
          </div>
        ) : (
          (() => {
            const totalQuestions = selectedType.questions.length;
            const totalPages = Math.ceil(totalQuestions / ITEMS_PER_PAGE);
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const currentQuestions = selectedType.questions.slice(
              startIndex,
              endIndex,
            );

            return (
              <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {currentQuestions.map((q: any) => (
                    <div
                      key={q.id}
                      onClick={() => handleQuestionSelect(q)}
                      className='group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-orange-400 dark:hover:border-orange-500 transition-all cursor-pointer hover:shadow-lg hover:shadow-orange-500/[0.03] flex flex-col justify-between'
                    >
                      <div>
                        <div className='flex justify-between items-start mb-4'>
                          <span className='font-mono text-sm font-bold text-slate-500 group-hover:text-orange-600 transition-colors'>
                            {q.questionCode}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(q.difficultyLevel)}`}
                          >
                            {q.difficultyLevel}
                          </span>
                        </div>

                        <p className='text-sm text-slate-700 dark:text-slate-300 line-clamp-3 min-h-[3rem] leading-relaxed mb-4'>
                          {q.textContent ||
                            q.questionStatement ||
                            'Practice this question to evaluate and improve your PTE performance.'}
                        </p>
                      </div>

                      <div className='flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80'>
                        <div className='flex items-center gap-1.5 text-xs font-semibold text-slate-400'>
                          <span>Last Attempt: </span>
                          <span className='text-slate-500 dark:text-slate-300 font-medium'>
                            {q.lastAttemptedAt
                              ? new Date(q.lastAttemptedAt).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </div>

                        <div className='flex items-center gap-1 text-orange-600 dark:text-orange-400 text-sm font-bold opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all'>
                          <span>Practice</span>
                          <ArrowRight className='h-4 w-4' />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className='flex items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80'>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className='p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-slate-300 font-semibold'
                    >
                      <ChevronLeft className='h-5 w-5' />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className='p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-slate-300 font-semibold'
                    >
                      <ChevronRight className='h-5 w-5' />
                    </button>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    );
  }

  // Category selection Grid
  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      {/* Categories Listing */}
      <div className='space-y-8'>
        {sections.map((category) => {
          const SectionIcon = category.icon;

          // Count predicted questions in this section
          const sectionCount = category.types.reduce(
            (acc, t) => acc + t.predictedCount,
            0,
          );

          return (
            <div
              key={category.id}
              className='space-y-4'
            >
              {/* Compact Category Header */}
              <div
                className={`${getColorClasses(
                  category.color,
                  'bg',
                )} ${getColorClasses(
                  category.color,
                  'border',
                )} border rounded-lg p-4`}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div
                      className={`${getColorClasses(
                        category.color,
                        'bg',
                      )} p-2 rounded-lg border ${getColorClasses(
                        category.color,
                        'border',
                      )}`}
                    >
                      <SectionIcon
                        className={`h-6 w-6 ${getColorClasses(
                          category.color,
                          'text',
                        )}`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-bold ${getColorClasses(
                          category.color,
                          'text',
                        )}`}
                      >
                        {category.title}
                      </h3>
                      <p className='text-sm text-gray-600 dark:text-gray-300'>
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm'>
                    <Flame className='h-3.5 w-3.5 text-orange-500 fill-orange-500' />
                    <span>{sectionCount} Predicted</span>
                  </div>
                </div>
              </div>

              {/* Compact Question Types Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                {category.types.map((qt) => {
                  const QuestionIcon = qt.icon;
                  const hasPredictions = qt.predictedCount > 0;

                  return (
                    <button
                      key={qt.name}
                      onClick={() => {
                        if (hasPredictions) {
                          navigate(`/portal/prediction?type=${qt.name}`);
                        }
                      }}
                      disabled={!hasPredictions}
                      className={`group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-left transition-all duration-200 flex flex-col justify-between min-h-[7.5rem] ${
                        hasPredictions
                          ? `${getColorClasses(category.color, 'hover')} hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer`
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className='flex items-start justify-between w-full mb-3'>
                        <div
                          className={`${getColorClasses(
                            category.color,
                            'bg',
                          )} p-2 rounded-lg`}
                        >
                          <QuestionIcon
                            className={`h-4 w-4 ${getColorClasses(
                              category.color,
                              'text',
                            )}`}
                          />
                        </div>
                        {hasPredictions ? (
                          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40 rounded-full transition-transform group-hover:scale-105'>
                            {qt.predictedCount} Predicted
                          </span>
                        ) : (
                          <span className='text-[10px] font-semibold text-gray-500 dark:text-gray-400'>
                            0 Predicted
                          </span>
                        )}
                      </div>

                      <div className='mt-4 flex items-center justify-between w-full'>
                        <h4 className='font-semibold text-gray-900 dark:text-white text-sm group-hover:text-gray-700 dark:group-hover:text-gray-200'>
                          {qt.title}
                        </h4>
                        {hasPredictions && (
                          <ArrowRight className='h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200' />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};;;;;

export default PredictedQuestions;
