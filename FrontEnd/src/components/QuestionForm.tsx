import {
  FileText,
  GripVertical,
  HelpCircle,
  Pause,
  Play,
  Plus,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import QuestionImageUpload from './QuestionImageUpload';

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
    difficultyLevel: question?.difficultyLevel || 'MEDIUM',
    textContent: question?.textContent || '',
    questionStatement: question?.questionStatement || '',
    audioKey: question?.audioUrl || '',
    imageKey: question?.imageUrl || '',
    options: question?.options || [],
    correctAnswers: question?.correctAnswers || [],
    wordCountMin: question?.wordCountMin || null,
    wordCountMax: question?.wordCountMax || null,
    durationMillis: question?.durationMillis || null,
    originalTextWithErrors: question?.originalTextWithErrors || '',
    incorrectWords: question?.incorrectWords || [],
    // New fields for enhanced question types
    paragraphs: question?.paragraphs || [],
    blanks: question?.blanks || [],
  });

  const [loading, setLoading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const [extractingAnswers, setExtractingAnswers] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<any>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [autoGenerateCode, setAutoGenerateCode] = useState(!question); // Auto-generate for new questions
  const [previewQuestionCode, setPreviewQuestionCode] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch preview question code when question type changes
  const fetchPreviewQuestionCode = async (questionTypeId: string) => {
    if (!questionTypeId || !autoGenerateCode) return;

    setLoadingPreview(true);
    try {
      const response = await api.get(
        `/admin/questions/next-code/${questionTypeId}`
      );
      if (response.data.success) {
        setPreviewQuestionCode(response.data.data.nextQuestionCode);
      }
    } catch (error) {
      console.error('Error fetching preview question code:', error);
      setPreviewQuestionCode('');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (formData.questionTypeId) {
      const foundType = Object.values(questionTypes)
        .flatMap((section: any) => section.questionTypes)
        .find((qt: any) => qt.id === formData.questionTypeId);
      setSelectedQuestionType(foundType || null);

      // Fetch preview question code for new questions
      if (autoGenerateCode) {
        fetchPreviewQuestionCode(formData.questionTypeId);
      }
    }
  }, [formData.questionTypeId, questionTypes, autoGenerateCode]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioPreview && audioPreview.startsWith('blob:')) {
        URL.revokeObjectURL(audioPreview);
      }
    };
  }, [audioPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare submission data
      const submissionData = { ...formData };

      // If there's a selected audio file, upload it first
      if (selectedAudioFile) {
        setUploadingAudio(true);
        try {
          console.log('Uploading audio file during question creation...');
          const audioKey = await uploadAudioFile(selectedAudioFile);
          console.log('Audio uploaded successfully, key:', audioKey);

          submissionData.audioKey = audioKey;
        } catch (error) {
          console.error('Error uploading audio:', error);
          alert('Failed to upload audio file. Please try again.');
          return;
        } finally {
          setUploadingAudio(false);
        }
      }

      // If auto-generating code, don't send questionCode (let backend generate it)
      if (autoGenerateCode) {
        delete submissionData.questionCode;
      }

      await onSubmit(submissionData);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioFileSelect = (file: File) => {
    // Store the file for later upload
    setSelectedAudioFile(file);

    // Create local preview URL
    const previewUrl = URL.createObjectURL(file);
    setAudioPreview(previewUrl);

    // Clear any existing audioKey since we have a new file
    setFormData((prev) => ({
      ...prev,
      audioKey: '',
    }));
  };

  const uploadAudioFile = async (file: File): Promise<string> => {
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

    return response.data.data.audioKey;
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

  // Enhanced option management
  const addOption = () => {
    const newOptions = [...(formData.options || [])];
    newOptions.push({ id: `option_${Date.now()}`, text: '', isCorrect: false });
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

  // Paragraph management for RE_ORDER_PARAGRAPHS
  const addParagraph = () => {
    const newParagraphs = [...(formData.paragraphs || [])];
    newParagraphs.push({
      id: `para_${Date.now()}`,
      text: '',
      correctOrder: newParagraphs.length + 1,
    });
    setFormData((prev) => ({ ...prev, paragraphs: newParagraphs }));
  };

  const updateParagraph = (index: number, field: string, value: any) => {
    const newParagraphs = [...(formData.paragraphs || [])];
    newParagraphs[index] = { ...newParagraphs[index], [field]: value };
    setFormData((prev) => ({ ...prev, paragraphs: newParagraphs }));
  };

  const removeParagraph = (index: number) => {
    const newParagraphs = [...(formData.paragraphs || [])];
    newParagraphs.splice(index, 1);
    // Update correct order for remaining paragraphs
    newParagraphs.forEach((para, idx) => {
      para.correctOrder = idx + 1;
    });
    setFormData((prev) => ({ ...prev, paragraphs: newParagraphs }));
  };

  const moveParagraph = (index: number, direction: 'up' | 'down') => {
    const newParagraphs = [...(formData.paragraphs || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newParagraphs.length) {
      [newParagraphs[index], newParagraphs[newIndex]] = [
        newParagraphs[newIndex],
        newParagraphs[index],
      ];
      // Update correct order
      newParagraphs.forEach((para, idx) => {
        para.correctOrder = idx + 1;
      });
      setFormData((prev) => ({ ...prev, paragraphs: newParagraphs }));
    }
  };

  // Blank management for FILL_IN_THE_BLANKS questions
  const addBlank = () => {
    const newBlanks = [...(formData.blanks || [])];
    newBlanks.push({
      id: `blank_${Date.now()}`,
      position: newBlanks.length + 1,
      options: [''],
      correctAnswer: '',
    });
    setFormData((prev) => ({ ...prev, blanks: newBlanks }));
  };

  const updateBlank = (index: number, field: string, value: any) => {
    const newBlanks = [...(formData.blanks || [])];
    newBlanks[index] = { ...newBlanks[index], [field]: value };
    setFormData((prev) => ({ ...prev, blanks: newBlanks }));
  };

  const removeBlank = (index: number) => {
    const newBlanks = [...(formData.blanks || [])];
    newBlanks.splice(index, 1);
    // Update positions
    newBlanks.forEach((blank, idx) => {
      blank.position = idx + 1;
    });
    setFormData((prev) => ({ ...prev, blanks: newBlanks }));
  };

  const addBlankOption = (blankIndex: number) => {
    const newBlanks = [...(formData.blanks || [])];
    newBlanks[blankIndex].options.push('');
    setFormData((prev) => ({ ...prev, blanks: newBlanks }));
  };

  const updateBlankOption = (
    blankIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const newBlanks = [...(formData.blanks || [])];
    newBlanks[blankIndex].options[optionIndex] = value;
    setFormData((prev) => ({ ...prev, blanks: newBlanks }));
  };

  const removeBlankOption = (blankIndex: number, optionIndex: number) => {
    const newBlanks = [...(formData.blanks || [])];
    newBlanks[blankIndex].options.splice(optionIndex, 1);
    setFormData((prev) => ({ ...prev, blanks: newBlanks }));
  };

  const getQuestionTypeRequirements = () => {
    if (!selectedQuestionType) return {};

    const requirements: any = {
      requiresAudio: [
        'REPEAT_SENTENCE',
        'RE_TELL_LECTURE',
        'ANSWER_SHORT_QUESTION',
        'SUMMARIZE_GROUP_DISCUSSION',
        'RESPOND_TO_A_SITUATION',
        'SUMMARIZE_SPOKEN_TEXT',
        'MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING',
        'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING',
        'LISTENING_FILL_IN_THE_BLANKS',
        'HIGHLIGHT_CORRECT_SUMMARY',
        'SELECT_MISSING_WORD',
        'WRITE_FROM_DICTATION',
        'HIGHLIGHT_INCORRECT_WORDS',
      ].includes(selectedQuestionType.name),

      requiresImage: selectedQuestionType.name === 'DESCRIBE_IMAGE',

      requiresText: [
        'READ_ALOUD',
        'SUMMARIZE_WRITTEN_TEXT',
        'WRITE_ESSAY',
        'MULTIPLE_CHOICE_SINGLE_ANSWER_READING',
        'MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING',
        'READING_FILL_IN_THE_BLANKS',
        'FILL_IN_THE_BLANKS_DRAG_AND_DROP',
        'RE_ORDER_PARAGRAPHS',
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

      requiresParagraphs: selectedQuestionType.name === 'RE_ORDER_PARAGRAPHS',

      requiresBlanks: [
        'READING_FILL_IN_THE_BLANKS',
        'FILL_IN_THE_BLANKS_DRAG_AND_DROP',
        // Note: LISTENING_FILL_IN_THE_BLANKS removed - blanks are auto-generated from audio
      ].includes(selectedQuestionType.name),
    };

    return requirements;
  };

  const requirements = getQuestionTypeRequirements();

  // Auto-generate blank options when text content changes for fill-in-the-blanks
  React.useEffect(() => {
    if (requirements.requiresBlanks && formData.textContent) {
      const blankCount = (formData.textContent.match(/_____/g) || []).length;
      const currentBlanks = formData.blanks || [];

      // Only update if blank count changed
      if (blankCount !== currentBlanks.length) {
        const newBlanks = Array.from({ length: blankCount }, (_, index) => {
          const existingBlank = currentBlanks[index];
          return (
            existingBlank || {
              id: `blank_${Date.now()}_${index}`,
              position: index + 1,
              correctAnswer: '',
              options: [''],
            }
          );
        });

        setFormData((prev) => ({
          ...prev,
          blanks: newBlanks,
        }));
      }
    }
  }, [formData.textContent, requirements.requiresBlanks]);

  const renderQuestionTypeSpecificFields = () => {
    if (!selectedQuestionType) return null;

    switch (selectedQuestionType.name) {
      case 'RE_ORDER_PARAGRAPHS':
        return (
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-3'>
              <label className='block text-sm font-medium text-gray-700'>
                Paragraphs (in correct order) *
              </label>
              <button
                type='button'
                onClick={addParagraph}
                className='px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors flex items-center space-x-1'
              >
                <Plus className='w-3 h-3' />
                <span>Add Paragraph</span>
              </button>
            </div>

            <div className='space-y-3'>
              {(formData.paragraphs || []).map(
                (paragraph: any, index: number) => (
                  <div
                    key={paragraph.id}
                    className='flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-white'
                  >
                    <div className='flex flex-col space-y-1'>
                      <button
                        type='button'
                        onClick={() => moveParagraph(index, 'up')}
                        disabled={index === 0}
                        className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
                      >
                        ↑
                      </button>
                      <GripVertical className='w-4 h-4 text-gray-400' />
                      <button
                        type='button'
                        onClick={() => moveParagraph(index, 'down')}
                        disabled={index === formData.paragraphs.length - 1}
                        className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
                      >
                        ↓
                      </button>
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium text-gray-700'>
                          Paragraph {index + 1}
                        </span>
                        <span className='text-xs text-gray-500'>
                          Order: {paragraph.correctOrder}
                        </span>
                      </div>
                      <textarea
                        value={paragraph.text || ''}
                        onChange={(e) =>
                          updateParagraph(index, 'text', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                        placeholder={`Enter paragraph ${index + 1} text`}
                        rows={3}
                        required
                      />
                    </div>
                    <button
                      type='button'
                      onClick={() => removeParagraph(index)}
                      className='p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                )
              )}
            </div>

            {(formData.paragraphs || []).length === 0 && (
              <p className='text-sm text-gray-500 text-center py-4'>
                No paragraphs added yet. Click "Add Paragraph" to create the
                text segments.
              </p>
            )}
          </div>
        );

      case 'READING_FILL_IN_THE_BLANKS':
      case 'FILL_IN_THE_BLANKS_DRAG_AND_DROP':
        return (
          <div className='space-y-6'>
            {/* Text with blanks */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Text Content with Blanks *
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
                rows={6}
                placeholder='Enter text with _____ for blanks. Example: The weather is _____ today and it will be _____ tomorrow.'
                required
              />
              <p className='text-xs text-gray-500 mt-1'>
                Use _____ (5 underscores) to mark blanks in the text
              </p>
            </div>

            {/* Blank options */}
            <div className='mb-6'>
              <div className='flex items-center justify-between mb-3'>
                <label className='block text-sm font-medium text-gray-700'>
                  Blank Options *
                </label>
                <button
                  type='button'
                  onClick={addBlank}
                  className='px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors flex items-center space-x-1'
                >
                  <Plus className='w-3 h-3' />
                  <span>Add Blank</span>
                </button>
              </div>

              <div className='space-y-4'>
                {(formData.blanks || []).map(
                  (blank: any, blankIndex: number) => (
                    <div
                      key={blank.id}
                      className='border border-gray-200 rounded-lg p-4 bg-gray-50'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <h4 className='text-sm font-medium text-gray-700'>
                          Blank {blank.position}
                        </h4>
                        <button
                          type='button'
                          onClick={() => removeBlank(blankIndex)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>

                      <div className='space-y-3'>
                        <div>
                          <label className='block text-xs font-medium text-gray-600 mb-1'>
                            Correct Answer *
                          </label>
                          <input
                            type='text'
                            value={blank.correctAnswer || ''}
                            onChange={(e) =>
                              updateBlank(
                                blankIndex,
                                'correctAnswer',
                                e.target.value
                              )
                            }
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-transparent'
                            placeholder='Enter the correct answer'
                            required
                          />
                        </div>

                        <div>
                          <div className='flex items-center justify-between mb-2'>
                            <label className='block text-xs font-medium text-gray-600'>
                              Dropdown Options
                            </label>
                            <button
                              type='button'
                              onClick={() => addBlankOption(blankIndex)}
                              className='text-xs text-indigo-600 hover:text-indigo-700'
                            >
                              + Add Option
                            </button>
                          </div>
                          <p className='text-xs text-gray-500 mb-2'>
                            Add all options that will appear in the dropdown.
                            The correct answer will be automatically included.
                          </p>
                          <div className='space-y-2'>
                            {blank.options?.map(
                              (option: string, optionIndex: number) => (
                                <div
                                  key={optionIndex}
                                  className='flex items-center space-x-2'
                                >
                                  <input
                                    type='text'
                                    value={option}
                                    onChange={(e) =>
                                      updateBlankOption(
                                        blankIndex,
                                        optionIndex,
                                        e.target.value
                                      )
                                    }
                                    className='flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent'
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                  <button
                                    type='button'
                                    onClick={() =>
                                      removeBlankOption(blankIndex, optionIndex)
                                    }
                                    className='text-red-600 hover:text-red-700'
                                  >
                                    <X className='w-3 h-3' />
                                  </button>
                                </div>
                              )
                            )}
                          </div>

                          {/* Auto-add correct answer button */}
                          {blank.correctAnswer &&
                            !blank.options?.includes(blank.correctAnswer) && (
                              <button
                                type='button'
                                onClick={() => {
                                  const newBlanks = [
                                    ...(formData.blanks || []),
                                  ];
                                  if (
                                    !newBlanks[blankIndex].options.includes(
                                      blank.correctAnswer
                                    )
                                  ) {
                                    newBlanks[blankIndex].options.push(
                                      blank.correctAnswer
                                    );
                                    setFormData((prev) => ({
                                      ...prev,
                                      blanks: newBlanks,
                                    }));
                                  }
                                }}
                                className='mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors'
                              >
                                + Add Correct Answer to Options
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {(formData.blanks || []).length === 0 && (
                <p className='text-sm text-gray-500 text-center py-4'>
                  No blanks configured yet. Add text content with _____ to
                  automatically generate blank fields.
                </p>
              )}
            </div>
          </div>
        );

      case 'LISTENING_FILL_IN_THE_BLANKS':
        return (
          <div className='space-y-6'>
            {/* Auto-generation notice */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex items-start space-x-3'>
                <div className='flex-shrink-0'>
                  <svg
                    className='w-5 h-5 text-blue-400'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <h4 className='text-sm font-medium text-blue-800'>
                    Auto-Generated Content
                  </h4>
                  <p className='text-sm text-blue-700 mt-1'>
                    For Listening Fill in the Blanks questions, the text content
                    with blanks will be automatically generated from your
                    uploaded audio file.
                  </p>
                  <p className='text-sm text-blue-700 mt-2'>
                    Simply upload an audio file and the system will:
                  </p>
                  <ul className='text-sm text-blue-700 mt-1 ml-4 list-disc'>
                    <li>Transcribe the audio content</li>
                    <li>Identify key words to remove</li>
                    <li>Create multiple choice options for each blank</li>
                    <li>Generate the complete fill-in-the-blanks exercise</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Optional text content override */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Text Content with Blanks (Optional)
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
                rows={6}
                placeholder='Leave empty to auto-generate from audio, or enter custom text with _____ for blanks.'
              />
              <p className='text-xs text-gray-500 mt-1'>
                If provided, use _____ (5 underscores) to mark blanks in the
                text. Otherwise, content will be auto-generated from the audio
                file.
              </p>
            </div>
          </div>
        );

      case 'HIGHLIGHT_INCORRECT_WORDS':
        return (
          <div className='space-y-6'>
            {/* Auto-generation notice */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex items-start space-x-3'>
                <div className='flex-shrink-0'>
                  <svg
                    className='w-5 h-5 text-blue-400'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div>
                  <h4 className='text-sm font-medium text-blue-800'>
                    Auto-Generated Content
                  </h4>
                  <p className='text-sm text-blue-700 mt-1'>
                    For Highlight Incorrect Words questions, the text with
                    errors will be automatically generated from your uploaded
                    audio file.
                  </p>
                  <p className='text-sm text-blue-700 mt-2'>
                    Simply upload an audio file and the system will:
                  </p>
                  <ul className='text-sm text-blue-700 mt-1 ml-4 list-disc'>
                    <li>Transcribe the audio content</li>
                    <li>Replace 3-5 words with similar but incorrect words</li>
                    <li>Create a list of incorrect words for evaluation</li>
                    <li>Generate the complete highlight exercise</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Optional text content override */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Text Content with Errors (Optional)
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
                rows={4}
                placeholder='Leave empty to auto-generate from audio, or enter custom text with intentional errors...'
              />
            </div>

            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Incorrect Words (Optional)
              </label>
              <p className='text-sm text-gray-600 mb-3'>
                Leave empty to auto-generate from audio, or manually specify the
                incorrect words.
              </p>
              <div className='space-y-2'>
                {(formData.incorrectWords || []).map(
                  (word: string, index: number) => (
                    <div
                      key={index}
                      className='flex items-center space-x-2'
                    >
                      <input
                        type='text'
                        value={word}
                        onChange={(e) => {
                          const newWords = [...(formData.incorrectWords || [])];
                          newWords[index] = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            incorrectWords: newWords,
                          }));
                        }}
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                        placeholder={`Incorrect word ${index + 1}`}
                      />
                      <button
                        type='button'
                        onClick={() => {
                          const newWords = [...(formData.incorrectWords || [])];
                          newWords.splice(index, 1);
                          setFormData((prev) => ({
                            ...prev,
                            incorrectWords: newWords,
                          }));
                        }}
                        className='p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  )
                )}
                <button
                  type='button'
                  onClick={() => {
                    const newWords = [...(formData.incorrectWords || []), ''];
                    setFormData((prev) => ({
                      ...prev,
                      incorrectWords: newWords,
                    }));
                  }}
                  className='w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors'
                >
                  + Add Incorrect Word
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto'>
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

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Question Code {!autoGenerateCode && '*'}
                  </label>
                  <div className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      id='autoGenerateCode'
                      checked={autoGenerateCode}
                      onChange={(e) => {
                        setAutoGenerateCode(e.target.checked);
                        if (e.target.checked) {
                          setFormData((prev) => ({
                            ...prev,
                            questionCode: '',
                          }));
                          if (formData.questionTypeId) {
                            fetchPreviewQuestionCode(formData.questionTypeId);
                          }
                        } else {
                          setPreviewQuestionCode('');
                        }
                      }}
                      className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                    />
                    <label
                      htmlFor='autoGenerateCode'
                      className='text-sm text-gray-600'
                    >
                      Auto-generate
                    </label>
                  </div>
                </div>

                {autoGenerateCode ? (
                  <div className='w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50'>
                    {loadingPreview ? (
                      <div className='flex items-center gap-2 text-gray-500'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600'></div>
                        <span className='text-sm'>Generating code...</span>
                      </div>
                    ) : previewQuestionCode ? (
                      <span className='text-gray-700 font-mono'>
                        {previewQuestionCode}
                      </span>
                    ) : (
                      <span className='text-gray-500 text-sm'>
                        Select a question type to preview code
                      </span>
                    )}
                  </div>
                ) : (
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
                    placeholder='e.g., RA_001'
                    required
                  />
                )}

                <p className='text-xs text-gray-500 mt-1'>
                  {autoGenerateCode
                    ? 'Question code will be automatically generated based on question type'
                    : 'Unique identifier for this question'}
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

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Difficulty Level *
                </label>
                <select
                  value={formData.difficultyLevel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficultyLevel: e.target.value,
                    }))
                  }
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  required
                >
                  <option value='EASY'>Easy</option>
                  <option value='MEDIUM'>Medium</option>
                  <option value='HARD'>Hard</option>
                </select>
                <p className='text-xs text-gray-500 mt-1'>
                  Easy: Basic level questions | Medium: Standard difficulty |
                  Hard: Advanced level questions
                </p>
              </div>
            </div>

            <div className='mt-4'>
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

          {/* Question Content */}
          {selectedQuestionType && (
            <div className='bg-blue-50 rounded-lg p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4 flex items-center gap-2'>
                <HelpCircle className='w-5 h-5' />
                Question Content
              </h3>

              {/* Text Content */}
              {requirements.requiresText &&
                !requirements.requiresParagraphs && (
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

              {/* Question Statement for Multiple Choice Questions */}
              {requirements.requiresOptions && (
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Question Statement *
                  </label>
                  <input
                    type='text'
                    value={formData.questionStatement}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        questionStatement: e.target.value,
                      }))
                    }
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    placeholder='e.g., "What can we infer from the passage?", "Which of the following statements are incorrect?"'
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Enter the actual question that will be asked to students
                    based on the text/audio content above
                  </p>
                </div>
              )}

              {/* Audio Upload */}
              {requirements.requiresAudio && (
                <div className='mb-6'>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Audio File *
                  </label>
                  <div className='border-2 border-dashed border-blue-300 rounded-lg p-6 bg-white'>
                    {formData.audioKey || selectedAudioFile ? (
                      <div className='text-center'>
                        <Volume2 className='w-12 h-12 text-green-600 mx-auto mb-3' />
                        <p className='text-sm text-green-600 font-medium mb-2'>
                          {formData.audioKey
                            ? 'Audio uploaded successfully'
                            : 'Audio file selected'}
                        </p>
                        <p className='text-xs text-gray-500 mb-4'>
                          {formData.audioKey || selectedAudioFile?.name}
                        </p>
                        {selectedAudioFile && !formData.audioKey && (
                          <div className='text-xs text-blue-600 mb-4'>
                            <p>
                              Audio will be uploaded when you create the
                              question
                            </p>
                            {selectedQuestionType?.name ===
                              'ANSWER_SHORT_QUESTION' && (
                              <p className='mt-1 text-green-600'>
                                🤖 AI will automatically extract correct answers
                                from the audio transcription using OpenAI
                              </p>
                            )}
                          </div>
                        )}

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
                            setSelectedAudioFile(null);
                            setAudioPreview(null);
                            // Revoke the object URL to free memory
                            if (
                              audioPreview &&
                              audioPreview.startsWith('blob:')
                            ) {
                              URL.revokeObjectURL(audioPreview);
                            }
                          }}
                          className='text-sm text-red-600 hover:text-red-700 transition-colors'
                        >
                          Remove Audio
                        </button>
                      </div>
                    ) : (
                      <div className='text-center'>
                        <Upload className='w-12 h-12 text-blue-400 mx-auto mb-3' />
                        <h3 className='text-lg font-medium text-gray-900 mb-2'>
                          Upload Audio File
                        </h3>
                        <p className='text-sm text-gray-600 mb-4'>
                          Drag and drop your audio file here, or click to browse
                        </p>

                        <input
                          type='file'
                          accept='audio/*'
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAudioFileSelect(file);
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

                        <div className='mt-4 text-xs text-gray-500 space-y-1'>
                          <p>Supported formats: MP3, WAV, OGG, M4A, AAC</p>
                          <p>Maximum file size: 50MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Image URL */}
              {requirements.requiresImage && (
                <div className='mb-6'>
                  <QuestionImageUpload
                    onImageUpload={(imageData) => {
                      setFormData((prev) => ({
                        ...prev,
                        imageKey: imageData.imageKey,
                      }));
                    }}
                    currentImageUrl={formData.imageKey}
                    currentImageKey={formData.imageKey}
                    label='Question Image'
                    required={true}
                  />
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
                    <div>
                      <label className='block text-sm font-medium text-gray-700'>
                        Answer Options *
                      </label>
                      <p className='text-xs text-gray-500 mt-1'>
                        {selectedQuestionType.name.includes('SINGLE_ANSWER')
                          ? 'Select one correct answer (radio buttons)'
                          : 'Select multiple correct answers (checkboxes)'}
                      </p>
                    </div>
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
                      (option: any, index: number) => {
                        const isSingleAnswer =
                          selectedQuestionType.name.includes('SINGLE_ANSWER');

                        return (
                          <div
                            key={option.id || index}
                            className='flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white'
                          >
                            <input
                              type={isSingleAnswer ? 'radio' : 'checkbox'}
                              name={
                                isSingleAnswer ? 'correctAnswer' : undefined
                              }
                              checked={option.isCorrect || false}
                              onChange={(e) => {
                                if (isSingleAnswer) {
                                  // For single answer, uncheck all others first
                                  const updatedOptions = (
                                    formData.options || []
                                  ).map((opt: any, i: number) => ({
                                    ...opt,
                                    isCorrect:
                                      i === index ? e.target.checked : false,
                                  }));
                                  setFormData((prev) => ({
                                    ...prev,
                                    options: updatedOptions,
                                  }));
                                } else {
                                  // For multiple answers, just toggle this option
                                  updateOption(
                                    index,
                                    'isCorrect',
                                    e.target.checked
                                  );
                                }
                              }}
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
                        );
                      }
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

              {/* Question Type Specific Fields */}
              {renderQuestionTypeSpecificFields()}
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
                  <>
                    <li>• Question statement is required</li>
                    <li>• Answer options are required</li>
                  </>
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
                {requirements.requiresParagraphs && (
                  <li>• Multiple paragraphs in correct order are required</li>
                )}
                {requirements.requiresBlanks && (
                  <li>• Blank options and correct answers are required</li>
                )}
                {requirements.requiresBlanks && (
                  <li>
                    • Each blank must have at least 3-5 dropdown options
                    including the correct answer
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
              disabled={
                loading ||
                uploadingAudio ||
                transcribingAudio ||
                extractingAnswers
              }
              className='px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
            >
              {uploadingAudio
                ? 'Uploading Audio...'
                : transcribingAudio
                ? 'Transcribing Audio...'
                : extractingAnswers
                ? 'Extracting Answers...'
                : loading
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
