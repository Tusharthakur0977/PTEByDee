import { Edit3, FileText, Image, Volume2 } from 'lucide-react';
import React from 'react';

interface QuestionTypeGuideProps {
  questionTypeName?: string;
  className?: string;
}

const QuestionTypeGuide: React.FC<QuestionTypeGuideProps> = ({
  questionTypeName,
  className = '',
}) => {
  if (!questionTypeName) return null;

  const getQuestionTypeInfo = (typeName: string) => {
    const guides: { [key: string]: any } = {
      READ_aloud: {
        title: 'Read Aloud',
        description:
          'Students read a text passage aloud within the time limit.',
        requirements: ['Text content'],
        tips: [
          'Text should be 60-80 words long',
          'Include proper nouns and challenging vocabulary',
          'Ensure clear punctuation for natural reading flow',
        ],
        icon: FileText,
        color: 'blue',
      },
      repeat_sentence: {
        title: 'Repeat Sentence',
        description: 'Students listen to a sentence and repeat it exactly.',
        requirements: ['Audio file'],
        tips: [
          'Sentences should be 3-9 seconds long',
          'Use natural speech patterns',
          'Include varied sentence structures',
        ],
        icon: Volume2,
        color: 'green',
      },
      describe_image: {
        title: 'Describe Image',
        description: 'Students describe an image in detail within 40 seconds.',
        requirements: ['Image URL'],
        tips: [
          'Use clear, high-quality images',
          'Include graphs, charts, or academic images',
          'Ensure images have multiple describable elements',
        ],
        icon: Image,
        color: 'purple',
      },
      re_tell_lecture: {
        title: 'Re-tell Lecture',
        description:
          'Students listen to a lecture and summarize the key points.',
        requirements: ['Audio file'],
        tips: [
          'Lectures should be 60-90 seconds long',
          'Include clear main points and supporting details',
          'Use academic vocabulary and concepts',
        ],
        icon: Volume2,
        color: 'orange',
      },
      answer_short_question: {
        title: 'Answer Short Question',
        description:
          'Students answer a brief question with one or a few words.',
        requirements: ['Audio file'],
        tips: [
          'Questions should have clear, factual answers',
          'Keep questions under 10 seconds',
          'Focus on general knowledge or academic topics',
        ],
        icon: Volume2,
        color: 'pink',
      },
      summarize_written_text: {
        title: 'Summarize Written Text',
        description: 'Students write a summary of a given text passage.',
        requirements: ['Text content', 'Word count limits (5-75 words)'],
        tips: [
          'Text should be 150-300 words long',
          'Include clear main ideas and supporting points',
          'Use academic or general interest topics',
        ],
        icon: Edit3,
        color: 'indigo',
      },
      write_essay: {
        title: 'Write Essay',
        description: 'Students write an essay on a given topic.',
        requirements: [
          'Text content (prompt)',
          'Word count limits (200-300 words)',
        ],
        tips: [
          'Provide clear, arguable prompts',
          'Include relevant context or background',
          'Allow for multiple valid perspectives',
        ],
        icon: Edit3,
        color: 'red',
      },
    };

    return guides[typeName.toLowerCase()] || null;
  };

  const guide = getQuestionTypeInfo(questionTypeName);

  if (!guide) return null;

  const IconComponent = guide.icon;
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    pink: 'bg-pink-50 border-pink-200 text-pink-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div
      className={`border rounded-lg p-4 ${
        colorClasses[guide.color as keyof typeof colorClasses]
      } ${className}`}
    >
      <div className='flex items-start gap-3'>
        <IconComponent className='w-5 h-5 mt-0.5 flex-shrink-0' />
        <div className='flex-1'>
          <h4 className='font-medium mb-2'>{guide.title}</h4>
          <p className='text-sm mb-3 opacity-90'>{guide.description}</p>

          <div className='space-y-3'>
            <div>
              <h5 className='text-sm font-medium mb-1'>Requirements:</h5>
              <ul className='text-sm space-y-1'>
                {guide.requirements.map((req: string, index: number) => (
                  <li
                    key={index}
                    className='flex items-center gap-2'
                  >
                    <div className='w-1.5 h-1.5 rounded-full bg-current opacity-60' />
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className='text-sm font-medium mb-1'>Best Practices:</h5>
              <ul className='text-sm space-y-1'>
                {guide.tips.map((tip: string, index: number) => (
                  <li
                    key={index}
                    className='flex items-start gap-2'
                  >
                    <div className='w-1.5 h-1.5 rounded-full bg-current opacity-60 mt-2 flex-shrink-0' />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionTypeGuide;
