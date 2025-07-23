import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, X } from 'lucide-react';
import {
  getCourseById,
  updateCourse,
  getCategories,
} from '../../services/admin';
import ImageUpload from '../../components/ImageUpload';
import VideoUpload from '../../components/VideoUpload';
import SectionVideoUpload from '../../components/SectionVideoUpload';
import LessonVideoUpload from '../../components/LessonVideoUpload';
import type {
  CreateCourseData,
  CourseSection,
  CourseLesson,
} from '../../services/admin';

const EditCourse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [courseData, setCourseData] = useState<CreateCourseData>({
    title: '',
    description: '',
    coursePreviewVideoUrl: '',
    isFree: true,
    imageUrl: '',
    price: 0,
    currency: 'USD',
    categoryIds: [],
    sections: [],
  });

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchCategories();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      setIsFetching(true);
      const response = await getCourseById(id!);
      if (response.success) {
        const course = response.data;
        setCourseData({
          title: course.title,
          description: course.description,
          coursePreviewVideoUrl: course.coursePreviewVideoUrl || '',
          isFree: course.isFree,
          imageUrl: course.imageUrl || '',
          price: course.price || 0,
          currency: course.currency || 'USD',
          categoryIds: course.categoryIds || [],
          sections:
            course.sections?.map((section: any) => ({
              id: section.id,
              title: section.title,
              description: section.description || '',
              videoUrl: section.videoUrl || '',
              videoKey: section.videoKey || '',
              order: section.order,
              lessons:
                section.lessons?.map((lesson: any) => ({
                  id: lesson.id,
                  title: lesson.title,
                  description: lesson.description || '',
                  videoUrl: lesson.videoUrl || '',
                  videoKey: lesson.videoKey || '',
                  textContent: lesson.textContent || '',
                  audioUrl: lesson.audioUrl || '',
                  order: lesson.order,
                })) || [],
            })) || [],
        });
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch course');
    } finally {
      setIsFetching(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleInputChange = (field: keyof CreateCourseData, value: any) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setCourseData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds?.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...(prev.categoryIds || []), categoryId],
    }));
  };

  const addSection = () => {
    const newSection: CourseSection = {
      id: `section_${Date.now()}`,
      title: '',
      description: '',
      videoUrl: '',
      order: (courseData.sections?.length || 0) + 1,
      lessons: [],
    };

    setCourseData((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));
  };

  const updateSection = (
    sectionIndex: number,
    field: keyof CourseSection,
    value: any
  ) => {
    setCourseData((prev) => ({
      ...prev,
      sections:
        prev.sections?.map((section, index) =>
          index === sectionIndex ? { ...section, [field]: value } : section
        ) || [],
    }));
  };

  const removeSection = (sectionIndex: number) => {
    setCourseData((prev) => ({
      ...prev,
      sections:
        prev.sections?.filter((_, index) => index !== sectionIndex) || [],
    }));
  };

  const addLesson = (sectionIndex: number) => {
    const newLesson: CourseLesson = {
      id: `lesson_${Date.now()}`,
      title: '',
      description: '',
      videoUrl: '',
      textContent: '',
      audioUrl: '',
      order: (courseData.sections?.[sectionIndex]?.lessons?.length || 0) + 1,
    };

    setCourseData((prev) => ({
      ...prev,
      sections:
        prev.sections?.map((section, index) =>
          index === sectionIndex
            ? { ...section, lessons: [...(section.lessons || []), newLesson] }
            : section
        ) || [],
    }));
  };

  const updateLesson = (
    sectionIndex: number,
    lessonIndex: number,
    field: keyof CourseLesson,
    value: any
  ) => {
    setCourseData((prev) => ({
      ...prev,
      sections:
        prev.sections?.map((section, sIndex) =>
          sIndex === sectionIndex
            ? {
                ...section,
                lessons:
                  section.lessons?.map((lesson, lIndex) =>
                    lIndex === lessonIndex
                      ? { ...lesson, [field]: value }
                      : lesson
                  ) || [],
              }
            : section
        ) || [],
    }));
  };

  const removeLesson = (sectionIndex: number, lessonIndex: number) => {
    setCourseData((prev) => ({
      ...prev,
      sections:
        prev.sections?.map((section, sIndex) =>
          sIndex === sectionIndex
            ? {
                ...section,
                lessons:
                  section.lessons?.filter(
                    (_, lIndex) => lIndex !== lessonIndex
                  ) || [],
              }
            : section
        ) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!courseData.title.trim()) {
      setError('Course title is required');
      return;
    }

    if (!courseData.description.trim()) {
      setError('Course description is required');
      return;
    }

    if (!courseData.isFree && (!courseData.price || courseData.price <= 0)) {
      setError('Price is required for paid courses');
      return;
    }

    try {
      setIsLoading(true);
      const response = await updateCourse(id!, courseData);
      if (response.success) {
        navigate('/admin/courses');
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error && isFetching) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>Error</h1>
          <p className='text-gray-600'>{error}</p>
          <button
            onClick={() => navigate('/admin/courses')}
            className='mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg'
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <div className='bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700'>
        <div className='container mx-auto px-4 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => navigate('/admin/courses')}
                className='p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              >
                <ArrowLeft className='h-5 w-5' />
              </button>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                  Edit Course
                </h1>
                <p className='text-gray-600 dark:text-gray-300 mt-1'>
                  Update course information and content
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                type='button'
                onClick={() => navigate('/admin/courses')}
                className='border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200'
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50'
              >
                {isLoading ? (
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                ) : (
                  <Save className='h-4 w-4' />
                )}
                <span>{isLoading ? 'Updating...' : 'Update Course'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-8'>
        <form
          onSubmit={handleSubmit}
          className='space-y-8'
        >
          {/* Error Message */}
          {error && (
            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg'>
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
              Basic Information
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Course Title *
                </label>
                <input
                  type='text'
                  value={courseData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='Enter course title'
                  required
                />
              </div>

              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Description *
                </label>
                <textarea
                  value={courseData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  rows={4}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  placeholder='Enter course description'
                  required
                />
              </div>

              <ImageUpload
                onImageUpload={(imageUrl) =>
                  handleInputChange('imageUrl', imageUrl)
                }
                currentImageUrl={courseData.imageUrl}
                label='Course Image'
                required={false}
              />

              <VideoUpload
                onVideoUpload={(videoUrl) =>
                  handleInputChange('coursePreviewVideoUrl', videoUrl)
                }
                currentVideoUrl={courseData.coursePreviewVideoUrl}
                label='Preview Video'
                required={false}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
              Pricing
            </h2>
            <div className='space-y-4'>
              <div className='flex items-center space-x-4'>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    checked={courseData.isFree}
                    onChange={() => handleInputChange('isFree', true)}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                  />
                  <span className='text-gray-900 dark:text-white'>
                    Free Course
                  </span>
                </label>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    checked={!courseData.isFree}
                    onChange={() => handleInputChange('isFree', false)}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                  />
                  <span className='text-gray-900 dark:text-white'>
                    Paid Course
                  </span>
                </label>
              </div>

              {!courseData.isFree && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Price *
                    </label>
                    <input
                      type='number'
                      min='0'
                      step='0.01'
                      value={courseData.price}
                      onChange={(e) =>
                        handleInputChange('price', parseFloat(e.target.value))
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      placeholder='0.00'
                      required={!courseData.isFree}
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Currency
                    </label>
                    <select
                      value={courseData.currency}
                      onChange={(e) =>
                        handleInputChange('currency', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    >
                      <option value='USD'>USD</option>
                      <option value='EUR'>EUR</option>
                      <option value='GBP'>GBP</option>
                      <option value='INR'>INR</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-6'>
              Categories
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
              {categories.map((category) => (
                <label
                  key={category.id}
                  className='flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                >
                  <input
                    type='checkbox'
                    checked={
                      courseData.categoryIds?.includes(category.id) || false
                    }
                    onChange={() => handleCategoryToggle(category.id)}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='text-sm text-gray-900 dark:text-white'>
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Course Sections */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                Course Content
              </h2>
              <button
                type='button'
                onClick={addSection}
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2'
              >
                <Plus className='h-4 w-4' />
                <span>Add Section</span>
              </button>
            </div>

            <div className='space-y-6'>
              {courseData.sections?.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  className='border border-gray-200 dark:border-gray-600 rounded-lg p-4'
                >
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                      Section {sectionIndex + 1}
                    </h3>
                    <button
                      type='button'
                      onClick={() => removeSection(sectionIndex)}
                      className='text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Section Title *
                      </label>
                      <input
                        type='text'
                        value={section.title}
                        onChange={(e) =>
                          updateSection(sectionIndex, 'title', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                        placeholder='Enter section title'
                        required
                      />
                    </div>
                    <SectionVideoUpload
                      onVideoUpload={(videoData) => {
                        updateSection(
                          sectionIndex,
                          'videoUrl',
                          videoData.videoUrl
                        );
                        updateSection(
                          sectionIndex,
                          'videoKey',
                          videoData.videoKey
                        );
                      }}
                      currentVideoUrl={section.videoUrl}
                      currentVideoKey={section.videoKey}
                      label='Section Video'
                      required={false}
                    />
                  </div>

                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Section Description
                    </label>
                    <textarea
                      value={section.description}
                      onChange={(e) =>
                        updateSection(
                          sectionIndex,
                          'description',
                          e.target.value
                        )
                      }
                      rows={2}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      placeholder='Enter section description'
                    />
                  </div>

                  {/* Lessons */}
                  <div className='border-t border-gray-200 dark:border-gray-600 pt-4'>
                    <div className='flex items-center justify-between mb-4'>
                      <h4 className='text-md font-medium text-gray-900 dark:text-white'>
                        Lessons
                      </h4>
                      <button
                        type='button'
                        onClick={() => addLesson(sectionIndex)}
                        className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center space-x-1'
                      >
                        <Plus className='h-3 w-3' />
                        <span>Add Lesson</span>
                      </button>
                    </div>

                    <div className='space-y-4'>
                      {section.lessons?.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <h5 className='text-sm font-medium text-gray-900 dark:text-white'>
                              Lesson {lessonIndex + 1}
                            </h5>
                            <button
                              type='button'
                              onClick={() =>
                                removeLesson(sectionIndex, lessonIndex)
                              }
                              className='text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                            >
                              <X className='h-3 w-3' />
                            </button>
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            <div>
                              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                                Lesson Title *
                              </label>
                              <input
                                type='text'
                                value={lesson.title}
                                onChange={(e) =>
                                  updateLesson(
                                    sectionIndex,
                                    lessonIndex,
                                    'title',
                                    e.target.value
                                  )
                                }
                                className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                                placeholder='Enter lesson title'
                                required
                              />
                            </div>
                            <div className='col-span-2'>
                              <LessonVideoUpload
                                onVideoUpload={(videoData) => {
                                  updateLesson(
                                    sectionIndex,
                                    lessonIndex,
                                    'videoUrl',
                                    videoData.videoUrl
                                  );
                                  updateLesson(
                                    sectionIndex,
                                    lessonIndex,
                                    'videoKey',
                                    videoData.videoKey
                                  );
                                }}
                                currentVideoUrl={lesson.videoUrl}
                                currentVideoKey={lesson.videoKey}
                                label='Lesson Video'
                                required={false}
                              />
                            </div>
                          </div>

                          <div className='mt-3'>
                            <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                              Lesson Description
                            </label>
                            <textarea
                              value={lesson.description}
                              onChange={(e) =>
                                updateLesson(
                                  sectionIndex,
                                  lessonIndex,
                                  'description',
                                  e.target.value
                                )
                              }
                              rows={2}
                              className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                              placeholder='Enter lesson description'
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {courseData.sections?.length === 0 && (
                <div className='text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg'>
                  <p className='text-gray-500 dark:text-gray-400 mb-4'>
                    No sections added yet. Add your first section to get
                    started.
                  </p>
                  <button
                    type='button'
                    onClick={addSection}
                    className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200'
                  >
                    Add First Section
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourse;
