import {
  ArrowRight,
  BookOpen,
  CheckSquare,
  Edit3,
  Eye,
  FileText,
  Headphones,
  MessageSquare,
  Mic,
  MousePointer,
  PenTool,
  RotateCcw,
  Search,
  Type,
  Volume2,
} from 'lucide-react';
import React from 'react';
import { getQuestionTypes } from '../services/portal';
import { PteQuestionTypeName } from '../types/pte';

interface QuestionTypeSelectorProps {
  selectedType: PteQuestionTypeName | null;
  onTypeSelect: (type: PteQuestionTypeName) => void;
  className?: string;
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  className = '',
}) => {
  const [questionTypes, setQuestionTypes] = React.useState<any>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchQuestionTypes();
  }, []);

  const fetchQuestionTypes = async () => {
    try {
      setIsLoading(true);
      const data = await getQuestionTypes();

      setQuestionTypes(data.groupedBySection);
    } catch (err: any) {
      setError('Failed to load question types');
      console.error('Error fetching question types:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='text-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
        <p className='text-gray-600 dark:text-gray-300'>
          Loading question types...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <div className='text-red-500 mb-4'>
          <BookOpen className='h-12 w-12 mx-auto' />
        </div>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
          Error Loading Question Types
        </h3>
        <p className='text-gray-600 dark:text-gray-300 mb-6'>{error}</p>
        <button
          onClick={fetchQuestionTypes}
          className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200'
        >
          Try Again
        </button>
      </div>
    );
  }

  const questionCategories = [
    ...Object.entries(questionTypes).map(
      ([sectionName, sectionData]: [string, any]) => {
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
            FILL_IN_THE_BLANKS_DRAG_AND_DROP: Edit3,
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

        const formatDuration = (expectedTime?: number) => {
          if (!expectedTime) return 'Variable';
          if (expectedTime < 60) return `${expectedTime}s`;
          return `${Math.floor(expectedTime / 60)}m`;
        };

        return {
          id: sectionName.toLowerCase().replace(/\s+/g, '-'),
          title: sectionName,
          icon: getSectionIcon(sectionName),
          color: getSectionColor(sectionName),
          description:
            sectionData.section.description ||
            `Practice ${sectionName.toLowerCase()} tasks`,
          types: sectionData.questionTypes.map((qt: any) => ({
            type: qt.name as PteQuestionTypeName,
            title: qt.name
              .split('_')
              .map(
                (word: string) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(' '),
            icon: getQuestionTypeIcon(qt.name),
            description:
              qt.description ||
              `Practice ${qt.name.toLowerCase().replace(/_/g, ' ')} questions`,
            duration: formatDuration(qt.expectedTimePerQuestion),
            questionCount: qt.questionCount,
          })),
        };
      }
    ),
  ];

  const getColorClasses = (
    color: string,
    variant: 'bg' | 'text' | 'border' | 'hover'
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Compact Header */}
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
          Choose Question Type
        </h2>
        <p className='text-gray-600 dark:text-gray-300'>
          Select from our comprehensive collection of PTE Academic question
          types
        </p>
      </div>

      {/* Question Categories */}
      <div className='space-y-8'>
        {questionCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.id}
              className='space-y-4'
            >
              {/* Compact Category Header */}
              <div
                className={`${getColorClasses(
                  category.color,
                  'bg'
                )} ${getColorClasses(
                  category.color,
                  'border'
                )} border rounded-lg p-4`}
              >
                <div className='flex items-center space-x-3'>
                  <div
                    className={`${getColorClasses(
                      category.color,
                      'bg'
                    )} p-2 rounded-lg border ${getColorClasses(
                      category.color,
                      'border'
                    )}`}
                  >
                    <IconComponent
                      className={`h-6 w-6 ${getColorClasses(
                        category.color,
                        'text'
                      )}`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-bold ${getColorClasses(
                        category.color,
                        'text'
                      )}`}
                    >
                      {category.title}
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact Question Types Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                {category.types.map((questionType: any) => {
                  const QuestionIcon = questionType.icon;
                  return (
                    <button
                      key={questionType.type}
                      onClick={() => onTypeSelect(questionType.type)}
                      className={`group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-left transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 ${getColorClasses(
                        category.color,
                        'hover'
                      )}`}
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div
                          className={`${getColorClasses(
                            category.color,
                            'bg'
                          )} p-2 rounded-lg`}
                        >
                          <QuestionIcon
                            className={`h-4 w-4 ${getColorClasses(
                              category.color,
                              'text'
                            )}`}
                          />
                        </div>
                        <ArrowRight className='h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200' />
                      </div>

                      <div>
                        <h4 className='font-semibold text-gray-900 dark:text-white mb-2 text-sm group-hover:text-gray-700 dark:group-hover:text-gray-200'>
                          {questionType.title}
                        </h4>
                        <div className='flex items-center justify-between'>
                          <div
                            className={`px-2 py-1 ${getColorClasses(
                              category.color,
                              'bg'
                            )} ${getColorClasses(
                              category.color,
                              'text'
                            )} rounded-md text-xs font-medium`}
                          >
                            {questionType.duration}
                          </div>
                          {questionType.questionCount !== undefined && (
                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                              {questionType.questionCount} questions
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Bottom CTA */}
      <div className='text-center pt-6 border-t border-gray-200 dark:border-gray-700'>
        <div className='bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
            Need Guidance?
          </h3>
          <p className='text-gray-600 dark:text-gray-300 mb-4'>
            Not sure where to start? Get personalized recommendations based on
            your goals.
          </p>
          <button className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl'>
            Get Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionTypeSelector;
