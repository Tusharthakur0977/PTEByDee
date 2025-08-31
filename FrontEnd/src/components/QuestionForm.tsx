import {
  FileText,
  HelpCircle,
  Pause,
  Play,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface QuestionFormProps {
  question?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  questionTypes: any;
  tests: any[];
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onSubmit,
  onCancel,
  questionTypes,
  tests,
}) => {
  const [formData, setFormData] = useState({
    questionCode: question?.questionCode || '',
    questionTypeId: question?.questionType?.id || '',
    testId: question?.test?.id || '',
    orderInTest: question?.orderInTest || 1,
    textContent: question?.textContent || '',
    audioKey: question?.audioUrl || '',
    imageUrl: question?.imageUrl || '',
    options: question?.options || [],
    correctAnswers: question?.correctAnswers || [],
    wordCountMin: question?.wordCountMin || null,
    wordCountMax: question?.wordCountMax || null,
    durationMillis: question?.durationMillis || null,
    originalTextWithErrors: question?.originalTextWithErrors || '',
    incorrectWords: question?.incorrectWords || [],
  });

  const [loading, setLoading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<any>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);

  useEffect(() => {
    if (formData.questionTypeId) {
      const foundType = Object.values(questionTypes)
        .flatMap((section: any) => section.questionTypes)
        .find((qt: any) => qt.id === formData.questionTypeId);
      setSelectedQuestionType(foundType || null);
    }
  }, [formData.questionTypeId, questionTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioUpload = async (file: File) => {
    setUploadingAudio(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('questionAudio', file);

      const response = await api.post(
        '/admin/upload/question-audio',
        uploadFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setFormData((prev) => ({
        ...prev,
        audioKey: response.data.audioKey,
      }));

      // Set preview URL if available
      if (response.data.audioUrl) {
        setAudioPreview(response.data.audioUrl);
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Failed to upload audio file. Please try again.');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleAudioPlay = () => {
    const audio = document.getElementById('preview-audio') as HTMLAudioElement;
    if (audio) {
      if (playingAudio) {
        audio.pause();
        setPlayingAudio(false);
      } else {
        audio.play();
        setPlayingAudio(true);
        audio.onended = () => setPlayingAudio(false);
      }
    }
  };

  const addOption = () => {
    const newOptions = [...(formData.options || [])];
    newOptions.push({ text: '', isCorrect: false });
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  const removeOption = (index: number) => {
    const newOptions = [...(formData.options || [])];
    newOptions.splice(index, 1);
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  const getQuestionTypeRequirements = () => {
    if (!selectedQuestionType) return {};

    const requirements: any = {
      requiresAudio: [
        'REPEAT_SENTENCE',
        'RE_TELL_LECTURE',
        'ANSWER_SHORT_QUESTION',
        'SUMMARIZE_SPOKEN_TEXT',
        'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
        'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
        'LISTENING_FILL_IN_THE_BLANKS',
        'HIGHLIGHT_CORRECT_SUMMARY',
        'SELECT_MISSING_WORD',
        'WRITE_FROM_DICTATION',
      ].includes(selectedQuestionType.name),

      requiresImage: selectedQuestionType.name === 'DESCRIBE_IMAGE',

      requiresText: [
        'READ_ALOUD',
        'SUMMARIZE_WRITTEN_TEXT',
        'WRITE_ESSAY',
        'MULTIPLE_CHOICE_SINGLE_ANSWER_READING',
        'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING',
        'READING_FILL_IN_THE_BLANKS',
        'READING_WRITING_FILL_IN_THE_BLANKS',
        'RE_ORDER_PARAGRAPHS',
        'HIGHLIGHT_INCORRECT_WORDS',
      ].includes(selectedQuestionType.name),

      requiresOptions: [
        'MULTIPLE_CHOICE_SINGLE_ANSWER_READING',
        'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING',
        'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
        'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
        'HIGHLIGHT_CORRECT_SUMMARY',
        'SELECT_MISSING_WORD',
      ].includes(selectedQuestionType.name),

      requiresWordCount: [
        'SUMMARIZE_WRITTEN_TEXT',
        'WRITE_ESSAY',
        'SUMMARIZE_SPOKEN_TEXT',
      ].includes(selectedQuestionType.name),

      requiresIncorrectWords:
        selectedQuestionType.name === 'HIGHLIGHT_INCORRECT_WORDS',
    };

    return requirements;
  };

  const requirements = getQuestionTypeRequirements();

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto'>
        <div className='sticky top-0 bg-white px-6 py-4 border-b border-gray-200 rounded-t-xl'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-gray-900'>
              {question ? 'Edit Question' : 'Create New Question'}
            </h2>
            <button
              onClick={onCancel}
              className='p-2 text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='w-6 h-6' />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className='p-6 space-y-8'
        >
          {/* Basic Information */}
          <div className='bg-gray-50 rounded-lg p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center gap-2'>
              <FileText className='w-5 h-5' />
              Basic Information
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Question Code *
                </label>
                <input
                  type='text'
                  value={formData.questionCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      questionCode: e.target.value,
                    }))
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  placeholder='e.g., RA_001_Test1'
                  required
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Unique identifier for this question
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Question Type *
                </label>
                <select
                  value={formData.questionTypeId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      questionTypeId: e.target.value,
                    }))
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  required
                >
                  <option value=''>Select Question Type</option>
                  {Object.entries(questionTypes).map(
                    ([sectionName, section]: [string, any]) => (
                      <optgroup
                        key={sectionName}
                        label={sectionName}
                      >
                        {section.questionTypes.map((qt: any) => (
                          <option
                            key={qt.id}
                            value={qt.id}
                          >
                            {qt.name
                              .split('_')
                              .map(
                                (word: string) =>
                                  word.charAt(0).toUpperCase() +
                                  word.slice(1).toLowerCase()
                              )
                              .join(' ')}
                          </option>
                        ))}
                      </optgroup>
                    )
                  )}
                </select>
              </div>

              {/* <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Test *
                </label>
                <select
                  value={formData.testId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, testId: e.target.value }))
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  required
                >
                  <option value=''>Select Test</option>
                  {tests.map((test) => (
                    <option
                      key={test.id}
                      value={test.id}
                    >
                      {test.title} ({test.testType})
                    </option>
                  ))}
                </select>
              </div> */}
            </div>

            {/* <div className='mt-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Order in Test
              </label>
              <input
                type='number'
                value={formData.orderInTest}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    orderInTest: parseInt(e.target.value),
                  }))
                }
                className='w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                min='1'
              />
            </div> */}
          </div>

          {/* Question Content */}
          {selectedQuestionType && (
            <div className='bg-blue-50 rounded-lg p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center gap-2'>
                <HelpCircle className='w-5 h-5' />
                Question Content
              </h3>

              {/* Text Content */}
              {requirements.requiresText && (
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Text Content *
                  </label>
                  <textarea
                    value={formData.textContent}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        textContent: e.target.value,
                      }))
                    }
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    rows={8}
                    placeholder='Enter the text content for this question...'
                    required
                  />
                </div>
              )}

              {/* Audio Upload */}
              {requirements.requiresAudio && (
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Audio File *
                  </label>
                  <div className='border-2 border-dashed border-blue-300 rounded-lg p-6 bg-white'>
                    {formData.audioKey ? (
                      <div className='text-center'>
                        <Volume2 className='w-12 h-12 text-green-600 mx-auto mb-3' />
                        <p className='text-sm text-green-600 font-medium mb-2'>
                          Audio uploaded successfully
                        </p>
                        <p className='text-xs text-gray-500 mb-4'>
                          {formData.audioKey}
                        </p>

                        {audioPreview && (
                          <div className='flex items-center justify-center gap-3 mb-4'>
                            <button
                              type='button'
                              onClick={handleAudioPlay}
                              className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                            >
                              {playingAudio ? (
                                <Pause className='w-4 h-4' />
                              ) : (
                                <Play className='w-4 h-4' />
                              )}
                              Preview
                            </button>
                            <audio
                              id='preview-audio'
                              src={audioPreview}
                              className='hidden'
                              onEnded={() => setPlayingAudio(false)}
                            />
                          </div>
                        )}

                        <button
                          type='button'
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, audioKey: '' }));
                            setAudioPreview(null);
                          }}
                          className='text-sm text-red-600 hover:text-red-700 transition-colors'
                        >
                          Remove Audio
                        </button>
                      </div>
                    ) : (
                      <div className='text-center'>
                        <Upload className='w-12 h-12 text-blue-400 mx-auto mb-3' />
                        <p className='text-sm text-gray-600 mb-3'>
                          Upload audio file for this question
                        </p>
                        <input
                          type='file'
                          accept='audio/*'
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAudioUpload(file);
                          }}
                          className='hidden'
                          id='audio-upload'
                          disabled={uploadingAudio}
                        />
                        <label
                          htmlFor='audio-upload'
                          className={`inline-flex items-center gap-2 px-6 py-3 border border-blue-300 rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 cursor-pointer transition-colors ${
                            uploadingAudio
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                        >
                          <Upload className='w-4 h-4' />
                          {uploadingAudio
                            ? 'Uploading...'
                            : 'Choose Audio File'}
                        </label>
                        <p className='text-xs text-gray-500 mt-3'>
                          Supported: MP3, WAV, OGG, M4A, AAC (Max: 50MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Image URL */}
              {requirements.requiresImage && (
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Image URL *
                  </label>
                  <div className='space-y-3'>
                    <input
                      type='url'
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          imageUrl: e.target.value,
                        }))
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                      placeholder='https://example.com/image.jpg'
                      required
                    />
                    {formData.imageUrl && (
                      <div className='border border-gray-200 rounded-lg p-3'>
                        <img
                          src={formData.imageUrl}
                          alt='Question preview'
                          className='max-w-full h-48 object-contain mx-auto rounded-lg'
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Word Count Limits */}
              {requirements.requiresWordCount && (
                <div className='grid grid-cols-2 gap-4 mb-6'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Minimum Word Count *
                    </label>
                    <input
                      type='number'
                      value={formData.wordCountMin || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          wordCountMin: parseInt(e.target.value) || null,
                        }))
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                      min='1'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Maximum Word Count *
                    </label>
                    <input
                      type='number'
                      value={formData.wordCountMax || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          wordCountMax: parseInt(e.target.value) || null,
                        }))
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                      min='1'
                      required
                    />
                  </div>
                </div>
              )}

              {/* Options for Multiple Choice */}
              {requirements.requiresOptions && (
                <div className='mb-6'>
                  <div className='flex items-center justify-between mb-3'>
                    <label className='block text-sm font-medium text-gray-700'>
                      Answer Options *
                    </label>
                    <button
                      type='button'
                      onClick={addOption}
                      className='px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors'
                    >
                      Add Option
                    </button>
                  </div>

                  <div className='space-y-3'>
                    {(formData.options || []).map(
                      (option: any, index: number) => (
                        <div
                          key={index}
                          className='flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white'
                        >
                          <input
                            type='checkbox'
                            checked={option.isCorrect || false}
                            onChange={(e) =>
                              updateOption(index, 'isCorrect', e.target.checked)
                            }
                            className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
                          />
                          <input
                            type='text'
                            value={option.text || ''}
                            onChange={(e) =>
                              updateOption(index, 'text', e.target.value)
                            }
                            className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                            placeholder={`Option ${index + 1}`}
                            required
                          />
                          <button
                            type='button'
                            onClick={() => removeOption(index)}
                            className='p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
                          >
                            <X className='w-4 h-4' />
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  {(formData.options || []).length === 0 && (
                    <p className='text-sm text-gray-500 text-center py-4'>
                      No options added yet. Click "Add Option" to create answer
                      choices.
                    </p>
                  )}
                </div>
              )}

              {/* Incorrect Words for Highlight Questions */}
              {requirements.requiresIncorrectWords && (
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Original Text with Errors *
                  </label>
                  <textarea
                    value={formData.originalTextWithErrors}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        originalTextWithErrors: e.target.value,
                      }))
                    }
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    rows={4}
                    placeholder='Enter the text with intentional errors that students need to identify...'
                    required
                  />

                  <div className='mt-3'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Incorrect Words (JSON Array) *
                    </label>
                    <input
                      type='text'
                      value={
                        formData.incorrectWords
                          ? JSON.stringify(formData.incorrectWords)
                          : ''
                      }
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setFormData((prev) => ({
                            ...prev,
                            incorrectWords: parsed,
                          }));
                        } catch {
                          // Invalid JSON, keep the text for editing
                        }
                      }}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm'
                      placeholder='["word1", "word2", "word3"]'
                      required
                    />
                  </div>
                </div>
              )}

              {/* Duration */}
              <div className='mb-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Duration (seconds)
                </label>
                <input
                  type='number'
                  value={
                    formData.durationMillis
                      ? Math.round(formData.durationMillis / 1000)
                      : ''
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      durationMillis: parseInt(e.target.value) * 1000 || null,
                    }))
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  min='1'
                  placeholder='e.g., 40 for 40 seconds'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Time limit for this question (optional)
                </p>
              </div>
            </div>
          )}

          {/* Question Type Help */}
          {selectedQuestionType && (
            <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
              <h4 className='text-sm font-medium text-amber-800 mb-2'>
                {selectedQuestionType.name
                  .split('_')
                  .map(
                    (word: string) =>
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  )
                  .join(' ')}{' '}
                Requirements:
              </h4>
              <ul className='text-sm text-amber-700 space-y-1'>
                {requirements.requiresText && (
                  <li>• Text content is required</li>
                )}
                {requirements.requiresAudio && (
                  <li>• Audio file is required</li>
                )}
                {requirements.requiresImage && <li>• Image URL is required</li>}
                {requirements.requiresOptions && (
                  <li>• Answer options are required</li>
                )}
                {requirements.requiresWordCount && (
                  <li>• Word count limits are required</li>
                )}
                {requirements.requiresIncorrectWords && (
                  <li>
                    • Original text with errors and incorrect words list are
                    required
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex justify-end gap-4 pt-6 border-t border-gray-200'>
            <button
              type='button'
              onClick={onCancel}
              className='px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading || uploadingAudio}
              className='px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
            >
              {loading
                ? 'Saving...'
                : question
                ? 'Update Question'
                : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;
