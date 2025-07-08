import React from 'react';
import {
  Mic,
  PenTool,
  Eye,
  Headphones,
  ArrowRight,
  BookOpen,
  MessageSquare,
  FileText,
  CheckSquare,
  RotateCcw,
  Volume2,
  Edit3,
  Search,
  MousePointer,
  Type,
} from 'lucide-react';
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
  const questionCategories = [
    {
      id: 'speaking',
      title: 'Speaking',
      icon: Mic,
      color: 'red',
      description: 'Practice speaking tasks with AI feedback',
      types: [
        {
          type: PteQuestionTypeName.READ_ALOUD,
          title: 'Read Aloud',
          icon: BookOpen,
          description: 'Read text aloud clearly and naturally',
          duration: '40 seconds',
        },
        {
          type: PteQuestionTypeName.REPEAT_SENTENCE,
          title: 'Repeat Sentence',
          icon: Volume2,
          description: 'Listen and repeat sentences exactly',
          duration: '15 seconds',
        },
        {
          type: PteQuestionTypeName.DESCRIBE_IMAGE,
          title: 'Describe Image',
          icon: Eye,
          description: 'Describe images in detail',
          duration: '40 seconds',
        },
        {
          type: PteQuestionTypeName.RE_TELL_LECTURE,
          title: 'Re-tell Lecture',
          icon: MessageSquare,
          description: 'Listen and retell lecture content',
          duration: '40 seconds',
        },
        {
          type: PteQuestionTypeName.ANSWER_SHORT_QUESTION,
          title: 'Answer Short Question',
          icon: MessageSquare,
          description: 'Answer questions with short responses',
          duration: '10 seconds',
        },
      ],
    },
    {
      id: 'writing',
      title: 'Writing',
      icon: PenTool,
      color: 'blue',
      description: 'Develop writing skills with structured practice',
      types: [
        {
          type: PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT,
          title: 'Summarize Written Text',
          icon: FileText,
          description: 'Summarize passages in one sentence',
          duration: '10 minutes',
        },
        {
          type: PteQuestionTypeName.WRITE_ESSAY,
          title: 'Write Essay',
          icon: Edit3,
          description: 'Write essays on given topics',
          duration: '20 minutes',
        },
      ],
    },
    {
      id: 'reading',
      title: 'Reading',
      icon: Eye,
      color: 'green',
      description: 'Enhance reading comprehension and speed',
      types: [
        {
          type: PteQuestionTypeName.READING_WRITING_FILL_IN_THE_BLANKS,
          title: 'Reading & Writing Fill in Blanks',
          icon: Edit3,
          description: 'Fill blanks with appropriate words',
          duration: '2-3 minutes',
        },
        {
          type: PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING,
          title: 'Multiple Choice (Multiple)',
          icon: CheckSquare,
          description: 'Select multiple correct answers',
          duration: '1-2 minutes',
        },
        {
          type: PteQuestionTypeName.RE_ORDER_PARAGRAPHS,
          title: 'Re-order Paragraphs',
          icon: RotateCcw,
          description: 'Arrange paragraphs in logical order',
          duration: '2-3 minutes',
        },
        {
          type: PteQuestionTypeName.READING_FILL_IN_THE_BLANKS,
          title: 'Reading Fill in Blanks',
          icon: Search,
          description: 'Choose words from dropdown menus',
          duration: '1-2 minutes',
        },
        {
          type: PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING,
          title: 'Multiple Choice (Single)',
          icon: MousePointer,
          description: 'Select one correct answer',
          duration: '1 minute',
        },
      ],
    },
    {
      id: 'listening',
      title: 'Listening',
      icon: Headphones,
      color: 'purple',
      description: 'Improve listening skills and comprehension',
      types: [
        {
          type: PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT,
          title: 'Summarize Spoken Text',
          icon: FileText,
          description: 'Listen and write summaries',
          duration: '10 minutes',
        },
        {
          type: PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING,
          title: 'Multiple Choice (Multiple)',
          icon: CheckSquare,
          description: 'Select multiple correct answers',
          duration: '1-2 minutes',
        },
        {
          type: PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS,
          title: 'Listening Fill in Blanks',
          icon: Type,
          description: 'Type missing words while listening',
          duration: '1-2 minutes',
        },
        {
          type: PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY,
          title: 'Highlight Correct Summary',
          icon: Search,
          description: 'Choose the best summary',
          duration: '1 minute',
        },
        {
          type: PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING,
          title: 'Multiple Choice (Single)',
          icon: MousePointer,
          description: 'Select one correct answer',
          duration: '1 minute',
        },
        {
          type: PteQuestionTypeName.SELECT_MISSING_WORD,
          title: 'Select Missing Word',
          icon: Volume2,
          description: 'Choose the missing word',
          duration: '30 seconds',
        },
        {
          type: PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS,
          title: 'Highlight Incorrect Words',
          icon: Search,
          description: 'Click on incorrect words',
          duration: '1-2 minutes',
        },
        {
          type: PteQuestionTypeName.WRITE_FROM_DICTATION,
          title: 'Write from Dictation',
          icon: Type,
          description: 'Type sentences you hear',
          duration: '1-2 minutes',
        },
      ],
    },
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
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className='text-center'>
        <h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>
          Choose Question Type
        </h2>
        <p className='text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
          Select from our comprehensive collection of PTE Academic question
          types to practice and improve your skills.
        </p>
      </div>

      {/* Question Categories */}
      <div className='space-y-12'>
        {questionCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <div
              key={category.id}
              className='space-y-6'
            >
              {/* Category Header */}
              <div
                className={`${getColorClasses(
                  category.color,
                  'bg'
                )} ${getColorClasses(
                  category.color,
                  'border'
                )} border rounded-xl p-6`}
              >
                <div className='flex items-center space-x-4'>
                  <div
                    className={`${getColorClasses(
                      category.color,
                      'bg'
                    )} p-3 rounded-full border ${getColorClasses(
                      category.color,
                      'border'
                    )}`}
                  >
                    <IconComponent
                      className={`h-8 w-8 ${getColorClasses(
                        category.color,
                        'text'
                      )}`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-2xl font-bold ${getColorClasses(
                        category.color,
                        'text'
                      )}`}
                    >
                      {category.title}
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300 mt-1'>
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Question Types Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {category.types.map((questionType) => {
                  const QuestionIcon = questionType.icon;
                  return (
                    <button
                      key={questionType.type}
                      onClick={() => onTypeSelect(questionType.type)}
                      className={`group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 ${getColorClasses(
                        category.color,
                        'hover'
                      )}`}
                    >
                      {/* Question Type Content */}
                      <div className='space-y-4'>
                        <div className='flex items-start justify-between'>
                          <div
                            className={`${getColorClasses(
                              category.color,
                              'bg'
                            )} p-2 rounded-lg`}
                          >
                            <QuestionIcon
                              className={`h-5 w-5 ${getColorClasses(
                                category.color,
                                'text'
                              )}`}
                            />
                          </div>
                          <ArrowRight className='h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200' />
                        </div>

                        <div>
                          <h4 className='font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-200'>
                            {questionType.title}
                          </h4>
                          <p className='text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2'>
                            {questionType.description}
                          </p>
                          <div className='flex items-center space-x-2'>
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
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect */}
                      <div className='absolute inset-0 bg-gradient-to-r from-transparent to-gray-50 dark:to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none'></div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className='text-center pt-8 border-t border-gray-200 dark:border-gray-700'>
        <div className='bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8'>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
            Need Help Choosing?
          </h3>
          <p className='text-gray-600 dark:text-gray-300 mb-4'>
            Not sure which question type to practice? Start with our recommended
            learning path.
          </p>
          <button className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl'>
            Get Personalized Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionTypeSelector;
