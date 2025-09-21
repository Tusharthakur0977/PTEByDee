import { ArrowLeft, HelpCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionForm from '../../components/QuestionForm';
import QuestionTypeGuide from '../../components/QuestionTypeGuide';
import { questionsService } from '../../services/questions';

const CreateQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [questionTypes, setQuestionTypes] = useState<any>({});
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [questionTypesData, testsData] = await Promise.all([
        questionsService.getQuestionTypes(),
        questionsService.getTests(),
      ]);

      setQuestionTypes(questionTypesData.groupedBySection);
      setTests(testsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await questionsService.createQuestion(data);
      navigate('/admin/questions');
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading question types and tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-4'>
            <button
              onClick={() => navigate('/admin/questions')}
              className='p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-6 h-6' />
            </button>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Create New Question
              </h1>
              <p className='text-gray-600 mt-1'>
                Add a new PTE practice question to your test bank
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Form */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
              <div className='p-6'>
                <QuestionForm
                  questionTypes={questionTypes}
                  tests={tests}
                  onSubmit={handleSubmit}
                  onCancel={() => navigate('/admin/questions')}
                />
              </div>
            </div>
          </div>

          {/* Sidebar with Guide */}
          <div className='space-y-6'>
            {/* Question Type Guide */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <HelpCircle className='w-5 h-5 text-indigo-600' />
                <h3 className='text-lg font-semibold text-gray-900'>
                  Question Type Guide
                </h3>
              </div>

              {selectedQuestionType ? (
                <QuestionTypeGuide questionTypeName={selectedQuestionType} />
              ) : (
                <div className='text-center py-8'>
                  <HelpCircle className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                  <p className='text-gray-500'>
                    Select a question type to see specific requirements and tips
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Quick Stats
              </h3>
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Total Tests</span>
                  <span className='font-medium text-gray-900'>
                    {tests.length}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Question Types</span>
                  <span className='font-medium text-gray-900'>
                    {Object.values(questionTypes).reduce(
                      (total: number, section: any) =>
                        total + section.questionTypes.length,
                      0
                    )}
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>PTE Sections</span>
                  <span className='font-medium text-gray-900'>
                    {Object.keys(questionTypes).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestion;
