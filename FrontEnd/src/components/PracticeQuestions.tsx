import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Loader,
  RotateCcw,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PracticeQuestion as PracticeQuestionType } from '../services/portal';
import {
  PreviousResponse,
  submitQuestionResponse,
} from '../services/questionResponse';
import { PteQuestionTypeName } from '../types/pte';
import AudioPlayer from './AudioPlayer';
import AudioRecorder from './AudioRecorder';
import PreviousResponses from './PreviousResponses';
import QuestionResponseEvaluator from './QuestionResponseEvaluator';
import ResponseDetailModal from './ResponseDetailModal';

// Utility function to play a beep sound
const playBeep = () => {
  const audioContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 1000; // 1000 Hz beep
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

interface PracticeQuestionProps {
  question: PracticeQuestionType;
  onComplete?: (response: any) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  className?: string;
}

const PracticeQuestion: React.FC<PracticeQuestionProps> = ({
  question,
  onComplete,
  onNext,
  onPrevious,
  hasPrevious = false,
  hasNext = false,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState(question.content.timeLimit || 300);
  const [isCompleted, setIsCompleted] = useState(false);
  const [response, setResponse] = useState<any>({});
  const [preparationTime, setPreparationTime] = useState(
    question.content.preparationTime || 0
  );
  const [isPreparationPhase, setIsPreparationPhase] = useState(
    !!question.content.preparationTime
  );
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
  const [hasUserStartedRecording, setHasUserStartedRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isAudioFinished, setIsAudioFinished] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [hasStartedPreparation, setHasStartedPreparation] = useState(false); // Track if preparation has been triggered
  const audioRecorderRef = useRef<any>(null);
  const lectureAudioPlayerRef = useRef<any>(null); // Ref for RE_TELL_LECTURE audio player
  const isAutoStartingRef = useRef<boolean>(false); // Ref to track if recording is auto-starting (for beep suppression)

  // Previous responses state
  const [showPreviousResponses, setShowPreviousResponses] = useState(false);
  const [selectedResponse, setSelectedResponse] =
    useState<PreviousResponse | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Check if current question is audio-based
  const isAudioBasedQuestion = [
    'READ_ALOUD',
    'REPEAT_SENTENCE',
    'DESCRIBE_IMAGE',
    'RE_TELL_LECTURE',
    'ANSWER_SHORT_QUESTION',
    'SUMMARIZE_GROUP_DISCUSSION',
    'RESPOND_TO_A_SITUATION',
  ].includes(question.type);

  // Reset everything when question changes
  useEffect(() => {
    setIsCompleted(false);
    setResponse({});
    setEvaluationResult(null);
    // For RE_TELL_LECTURE, SUMMARIZE_GROUP_DISCUSSION, SUMMARIZE_SPOKEN_TEXT, and RESPOND_TO_A_SITUATION, don't set timeLeft initially - only show timer after audio ends
    if (
      question.type === PteQuestionTypeName.RE_TELL_LECTURE ||
      question.type === PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION ||
      question.type === PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT ||
      question.type === PteQuestionTypeName.RESPOND_TO_A_SITUATION
    ) {
      setTimeLeft(0);
      setPreparationTime(0);
      setIsPreparationPhase(false);
      setHasStartedPreparation(false); // Reset preparation flag
    } else {
      setTimeLeft(question.content.timeLimit || 300);
      setPreparationTime(question.content.preparationTime || 0);
      setIsPreparationPhase(!!question.content.preparationTime);
    }
    setIsAudioReady(false);
    setIsProcessingAudio(false);
    setIsAudioFinished(false); // Reset audio finished state for new question

    // Reset previous responses state
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);

    // Don't reset AudioRecorder on question change - let it handle its own cleanup
  }, [
    question.id,
    question.content.timeLimit,
    question.content.preparationTime,
    question.type,
  ]);

  const handleSubmit = useCallback(async () => {
    if (isCompleted || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setIsProcessingAudio(isAudioBasedQuestion);

      // Prepare response data based on question type
      const responseData = {
        questionId: question.id,
        userResponse: response,
        timeTakenSeconds: (question.content.timeLimit || 300) - timeLeft,
      };

      // Submit for evaluation
      const result = await submitQuestionResponse(responseData);

      // Update local state with evaluation results
      setEvaluationResult(result.evaluation);
      setResponse({
        ...response,
        evaluation: result.evaluation,
        transcribedText: result.transcribedText, // Store transcribed text for display
      });

      setIsCompleted(true);

      // Call completion callback
      onComplete?.(result);
    } catch (error: any) {
      console.error('Error submitting response:', error);
      // Show error to user but don't prevent them from continuing
      const errorEvaluation = {
        score: 0,
        isCorrect: false,
        feedback:
          error.message || 'An error occurred while evaluating your response.',
        detailedAnalysis: {},
        suggestions: [
          'Please try again or contact support if the issue persists.',
        ],
      };

      setEvaluationResult(errorEvaluation);
      setResponse({
        ...response,
        evaluation: errorEvaluation,
      });
      setIsCompleted(true);
    } finally {
      setIsSubmitting(false);
      setIsProcessingAudio(false);
    }
  }, [
    isCompleted,
    isSubmitting,
    question.id,
    question.content.timeLimit,
    response,
    timeLeft,
    onComplete,
    isAudioBasedQuestion,
  ]);

  // Reset state when question changes
  useEffect(() => {
    setIsAudioFinished(false);
    setRecordingTimeLeft(0);
    setHasUserStartedRecording(false);
    isAutoStartingRef.current = false;
  }, [question.id]);

  // Check if this question type should have a timer
  const shouldShowTimer =
    question.type === PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT ||
    question.type === PteQuestionTypeName.WRITE_ESSAY ||
    question.type === PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT ||
    question.type === PteQuestionTypeName.DESCRIBE_IMAGE ||
    question.type === PteQuestionTypeName.READ_ALOUD ||
    question.type === PteQuestionTypeName.RE_TELL_LECTURE ||
    question.type === PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION ||
    question.type === PteQuestionTypeName.RESPOND_TO_A_SITUATION;

  // Timer effect - only run for questions that should have timers
  useEffect(() => {
    if (!shouldShowTimer) return; // Skip timer logic for questions without timers

    // Don't run prep timer if user has already started recording
    if (isPreparationPhase && preparationTime > 0 && !hasUserStartedRecording) {
      const timer = setTimeout(
        () => setPreparationTime(preparationTime - 1),
        1000
      );
      return () => clearTimeout(timer);
    } else if (
      isPreparationPhase &&
      preparationTime === 0 &&
      !hasUserStartedRecording
    ) {
      // Preparation time ended and user hasn't started recording yet
      setIsPreparationPhase(false);

      // Set recording time based on question type
      let recordingTime = question.content.recordingTime || 40; // Default 40 for most audio questions

      if (question.type === PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION) {
        recordingTime = question.content.recordingTime || 120; // 120 seconds for SUMMARIZE_GROUP_DISCUSSION
      } else if (question.type === PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT) {
        recordingTime = question.content.timeLimit || 600; // 10 minutes for SUMMARIZE_SPOKEN_TEXT
      }
      setTimeLeft(recordingTime);

      // Auto-start recording only for RESPOND_TO_A_SITUATION if user hasn't started
      if (
        question.type === PteQuestionTypeName.RESPOND_TO_A_SITUATION &&
        isPreparationPhase &&
        preparationTime === 0 &&
        !hasUserStartedRecording &&
        !isCompleted
      ) {
        // Play beep to signal recording start
        console.log('BEEP!555555');
        playBeep();
        // Mark that we're auto-starting BEFORE playing beep and starting recording
        isAutoStartingRef.current = true;

        // Schedule auto-start recording with a slight delay to ensure state updates
        setTimeout(() => {
          setHasUserStartedRecording(true);

          if (audioRecorderRef.current?.startRecording) {
            audioRecorderRef.current.startRecording();
          }

          // Reset the ref after a short delay
          setTimeout(() => {
            isAutoStartingRef.current = false;
          }, 50);
        }, 100);
      }
      // For Describe Image, just end preparation phase - user will manually start recording
      if (question.type === PteQuestionTypeName.DESCRIBE_IMAGE) {
        // Recording will be started manually by the user
      }
    } else if (!isPreparationPhase && timeLeft > 0 && !isCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isCompleted) {
      // For audio-based questions and writing questions, don't auto-submit when time runs out
      // Let user manually submit after reviewing their recording/response
      const isWritingQuestion = [
        PteQuestionTypeName.WRITE_ESSAY,
        PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT,
        PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT,
      ].includes(question.type);

      if (!isAudioBasedQuestion && !isWritingQuestion) {
        handleSubmit();
      }
    }
  }, [
    timeLeft,
    preparationTime,
    isPreparationPhase,
    isCompleted,
    question.content,
    question.type,
    isAudioBasedQuestion,
    handleSubmit,
    shouldShowTimer,
    hasUserStartedRecording,
  ]);

  // For Re-tell Lecture, Summarize Group Discussion, Summarize Spoken Text, and Respond to a Situation - start preparation phase when audio finishes
  useEffect(() => {
    if (
      (question.type === PteQuestionTypeName.RE_TELL_LECTURE ||
        question.type === PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION ||
        question.type === PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT ||
        question.type === PteQuestionTypeName.RESPOND_TO_A_SITUATION) &&
      isAudioFinished &&
      !isCompleted &&
      !hasStartedPreparation && // Only trigger once
      !hasUserStartedRecording // Don't start prep phase if user already started recording
    ) {
      // Start preparation phase with 10 seconds
      setIsPreparationPhase(true);
      setPreparationTime(10); // Always 10 seconds for these question types
      setHasStartedPreparation(true); // Mark that preparation has been triggered
    }
  }, [
    question.type,
    isAudioFinished,
    isCompleted,
    hasStartedPreparation,
    hasUserStartedRecording,
  ]);

  // For Read Aloud: Auto-start recording after preparation time ends (if user hasn't started)
  useEffect(() => {
    if (
      question.type === PteQuestionTypeName.READ_ALOUD &&
      isPreparationPhase &&
      preparationTime === 0 &&
      !hasUserStartedRecording &&
      !isCompleted
    ) {
      // Auto-start recording with beep
      console.log('BEEP!54444444');

      playBeep();
      isAutoStartingRef.current = true;
      setRecordingTimeLeft(40); // 40 seconds for Read Aloud

      // Auto-start recording after a short delay
      setTimeout(() => {
        if (audioRecorderRef.current?.startRecording) {
          audioRecorderRef.current.startRecording();
        }
        // Reset after recording starts
        setTimeout(() => {
          isAutoStartingRef.current = false;
        }, 50);
      }, 500);
    }
  }, [
    question.type,
    isPreparationPhase,
    preparationTime,
    hasUserStartedRecording,
    isCompleted,
  ]);

  // Handle manual recording start for Read Aloud - pause preparation time
  const handleReadAloudRecordingStart = () => {
    if (
      question.type === PteQuestionTypeName.READ_ALOUD &&
      isPreparationPhase
    ) {
      console.log('BEEP6666666666');

      playBeep(); // Beep when user manually starts recording
      setHasUserStartedRecording(true);
      setIsPreparationPhase(false);
      setRecordingTimeLeft(40); // 40 seconds for Read Aloud
    }
  };

  // Handle manual recording start for Repeat Sentence, Answer Short Question, Describe Image
  const handleOtherSpeakingRecordingStart = () => {
    if (
      (question.type === PteQuestionTypeName.REPEAT_SENTENCE ||
        question.type === PteQuestionTypeName.ANSWER_SHORT_QUESTION) &&
      isAudioFinished
    ) {
      // Only play beep if not auto-starting
      if (!isAutoStartingRef.current) {
        // playBeep(); // Beep when user manually starts recording
      }
      setHasUserStartedRecording(true);
      // Set appropriate recording time
      let recordingDuration = 10;
      if (question.type === PteQuestionTypeName.REPEAT_SENTENCE) {
        recordingDuration = 15;
      }
      setRecordingTimeLeft(recordingDuration);
    } else if (
      question.type === PteQuestionTypeName.DESCRIBE_IMAGE &&
      isPreparationPhase
    ) {
      // Only play beep if not auto-starting
      if (!isAutoStartingRef.current) {
        console.log('BEEP!8888888');
        playBeep(); // Beep when user manually starts recording
      }
      setHasUserStartedRecording(true);
      setIsPreparationPhase(false);
      setRecordingTimeLeft(40); // 40 seconds for Describe Image
    } else if (question.type === PteQuestionTypeName.RESPOND_TO_A_SITUATION) {
      // Handle RESPOND_TO_A_SITUATION for both: during audio playback and during preparation phase
      // Skip if auto-starting to prevent double beep and duplicate state changes
      console.log(isAutoStartingRef.current, 'ZZZZZ');

      if (!isAutoStartingRef.current) {
        console.log('BEEP!RESPONDTOSITUATION');
        playBeep(); // Beep when user manually starts recording
      }

      setHasUserStartedRecording(true);
      // Stop the audio when user starts recording
      if (lectureAudioPlayerRef.current?.stop) {
        lectureAudioPlayerRef.current.stop();
      }
      // If in preparation phase, end it and set recording time
      if (isPreparationPhase) {
        setIsPreparationPhase(false);
      }
      // Set recording time
      setRecordingTimeLeft(question.content.recordingTime || 40);
      // Prevent preparation phase from starting when audio finishes
      setHasStartedPreparation(true);
    } else if (
      question.type === PteQuestionTypeName.RE_TELL_LECTURE ||
      question.type === PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION
    ) {
      console.log(isAutoStartingRef.current, 'ZZZZZ');

      // Only play beep if not auto-starting (check ref, not state, for immediate effect)
      if (!isAutoStartingRef.current) {
        console.log('BEEP!99999999');

        playBeep(); // Beep when user manually starts recording
      }
      setHasUserStartedRecording(true);
      // Stop the audio when user starts recording
      if (lectureAudioPlayerRef.current?.stop) {
        lectureAudioPlayerRef.current.stop();
      }
      // If in preparation phase, end it and set recording time
      if (isPreparationPhase) {
        setIsPreparationPhase(false);
        // 40 seconds for RE_TELL_LECTURE, 120 seconds (2 minutes) for SUMMARIZE_GROUP_DISCUSSION
        const recordingDuration =
          question.type === PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION
            ? 120
            : 40;
        setRecordingTimeLeft(recordingDuration);
      }
    }
  };

  // Recording timer for all speaking questions with auto/manual start
  useEffect(() => {
    if (
      (question.type === PteQuestionTypeName.REPEAT_SENTENCE ||
        question.type === PteQuestionTypeName.ANSWER_SHORT_QUESTION) &&
      isAudioFinished &&
      !isCompleted &&
      !hasUserStartedRecording
    ) {
      // Mark as auto-starting BEFORE playing beep
      isAutoStartingRef.current = true;
      // Play beep and auto-start recording

      console.log('BEEP!');

      playBeep();
      let recordingDuration = 10;
      if (question.type === PteQuestionTypeName.REPEAT_SENTENCE) {
        recordingDuration = 15;
      }
      setRecordingTimeLeft(recordingDuration);
      setHasUserStartedRecording(true);

      // Auto-start recording after a short delay
      setTimeout(() => {
        if (audioRecorderRef.current?.startRecording) {
          audioRecorderRef.current.startRecording();
        }
        // Reset after recording starts
        setTimeout(() => {
          isAutoStartingRef.current = false;
        }, 50);
      }, 500);
    }
  }, [question.type, isAudioFinished, isCompleted, hasUserStartedRecording]);

  // Auto-start recording for Describe Image when preparation phase ends
  useEffect(() => {
    if (
      question.type === PteQuestionTypeName.DESCRIBE_IMAGE &&
      isPreparationPhase &&
      preparationTime === 0 &&
      !hasUserStartedRecording &&
      !isCompleted
    ) {
      // Play beep and auto-start recording
      console.log('BEEP2');

      playBeep();
      isAutoStartingRef.current = true;
      setRecordingTimeLeft(40); // 40 seconds for Describe Image

      // Auto-start recording after a short delay
      setTimeout(() => {
        if (audioRecorderRef.current?.startRecording) {
          audioRecorderRef.current.startRecording();
        }
        // Reset after recording starts
        setTimeout(() => {
          isAutoStartingRef.current = false;
        }, 50);
      }, 500);
    }
  }, [
    question.type,
    isPreparationPhase,
    preparationTime,
    hasUserStartedRecording,
    isCompleted,
  ]);

  // Auto-start recording for Re-tell Lecture and Summarize Group Discussion when preparation phase ends
  useEffect(() => {
    if (
      (question.type === PteQuestionTypeName.RE_TELL_LECTURE ||
        question.type === PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION) &&
      isPreparationPhase &&
      preparationTime === 0 &&
      !hasUserStartedRecording &&
      !isCompleted
    ) {
      // Mark as auto-starting BEFORE playing beep
      isAutoStartingRef.current = true;
      // Play beep and auto-start recording
      console.log('BEEP!33');
      playBeep();
      // 40 seconds for RE_TELL_LECTURE, 120 seconds (2 minutes) for SUMMARIZE_GROUP_DISCUSSION
      const recordingDuration =
        question.type === PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION
          ? 120
          : 40;
      setRecordingTimeLeft(recordingDuration);
      setHasUserStartedRecording(true);

      // Auto-start recording after a short delay
      setTimeout(() => {
        if (audioRecorderRef.current?.startRecording) {
          audioRecorderRef.current.startRecording();
        }
        // Reset after recording starts
        setTimeout(() => {
          isAutoStartingRef.current = false;
        }, 50);
      }, 500);
    }
  }, [
    question.type,
    isPreparationPhase,
    preparationTime,
    hasUserStartedRecording,
    isCompleted,
  ]);

  // Recording timer for all speaking questions with auto/manual start
  useEffect(() => {
    if (
      question.type === PteQuestionTypeName.READ_ALOUD &&
      !isPreparationPhase &&
      recordingTimeLeft > 0 &&
      !isCompleted &&
      hasUserStartedRecording
    ) {
      const timer = setTimeout(
        () => setRecordingTimeLeft(recordingTimeLeft - 1),
        1000
      );
      return () => clearTimeout(timer);
    } else if (
      question.type === PteQuestionTypeName.READ_ALOUD &&
      !isPreparationPhase &&
      recordingTimeLeft === 0 &&
      hasUserStartedRecording &&
      !isCompleted
    ) {
      // Stop recording when time runs out
      if (audioRecorderRef.current?.stopRecording) {
        audioRecorderRef.current.stopRecording();
      }
    }
  }, [
    question.type,
    isPreparationPhase,
    recordingTimeLeft,
    isCompleted,
    hasUserStartedRecording,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioRecordingComplete = (audioKey: string) => {
    console.log('Audio recording completed with key:', audioKey);
    setIsProcessingAudio(true);
    setResponse({ audioResponseUrl: audioKey });

    // Show processing message for a moment, then mark audio as ready for review
    setTimeout(() => {
      setIsProcessingAudio(false);
      setIsAudioReady(true);
    }, 1500);
  };

  // Manual submit handler for audio questions
  const handleManualSubmit = () => {
    if (isAudioBasedQuestion && !response.audioResponseUrl) {
      alert('Please record your audio response first.');
      return;
    }
    handleSubmit();
  };

  const handleReset = () => {
    setIsCompleted(false);
    setResponse({});
    setEvaluationResult(null);
    // For RE_TELL_LECTURE, SUMMARIZE_GROUP_DISCUSSION, RESPOND_TO_A_SITUATION - don't set timeLeft initially - only show timer after audio ends
    if (
      question.type === PteQuestionTypeName.RE_TELL_LECTURE ||
      question.type === PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION ||
      question.type === PteQuestionTypeName.RESPOND_TO_A_SITUATION
    ) {
      setTimeLeft(0);
      setPreparationTime(0);
      setIsPreparationPhase(false);
      setHasStartedPreparation(false); // Reset preparation flag
    } else {
      setTimeLeft(question.content.timeLimit || 300);
      setPreparationTime(question.content.preparationTime || 0);
      setIsPreparationPhase(!!question.content.preparationTime);
    }
    setIsAudioReady(false);
    setIsProcessingAudio(false);
    setIsAudioFinished(false);
    setRecordingTimeLeft(0);
    setHasUserStartedRecording(false);
    isAutoStartingRef.current = false;

    // Reset previous responses state
    setShowPreviousResponses(false);
    setSelectedResponse(null);
    setShowResponseModal(false);

    // Force AudioRecorder to re-render and reset
    setResetKey((prev) => prev + 1);

    // Reset audio players
    const audioRecorders = document.querySelectorAll('audio');
    audioRecorders.forEach((audio) => {
      audio.currentTime = 0;
      audio.pause();
    });
  };

  // Previous responses handlers
  const handleViewResponse = (response: PreviousResponse) => {
    setSelectedResponse(response);
    setShowResponseModal(true);
  };

  const handleCloseResponseModal = () => {
    setShowResponseModal(false);
    setSelectedResponse(null);
  };

  const togglePreviousResponses = () => {
    setShowPreviousResponses(!showPreviousResponses);
  };

  // Helper function to render listening tips
  const renderListeningTips = () => (
    <div className='bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800'>
      <h4 className='font-medium text-purple-900 dark:text-purple-100 mb-2 text-sm'>
        💡 Listening Tips
      </h4>
      <ul className='text-xs text-purple-800 dark:text-purple-200 space-y-1'>
        <li>• Focus on the context around each blank</li>
        <li>• Pay attention to grammar and word forms</li>
      </ul>
    </div>
  );

  const renderQuestionContent = () => {
    switch (question.type) {
      case PteQuestionTypeName.READ_ALOUD:
        return (
          <div className='space-y-6'>
            {/* Text to Read */}
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
              <p className='text-lg leading-relaxed text-gray-900 dark:text-white'>
                {question.content.text}
              </p>
            </div>

            {/* Audio Recorder - Show during preparation and recording phases */}
            <AudioRecorder
              ref={audioRecorderRef}
              onRecordingComplete={handleAudioRecordingComplete}
              onRecordingStart={handleReadAloudRecordingStart}
              maxDuration={40}
              autoUpload={true}
              disabled={isCompleted}
              key={`recorder-${question.id}-${resetKey}`}
            />
          </div>
        );

      case PteQuestionTypeName.REPEAT_SENTENCE:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen to the sentence'
                autoPlay={true}
                autoPlayDelay={1000}
                onEnded={() => setIsAudioFinished(true)}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>
            <AudioRecorder
              ref={audioRecorderRef}
              onRecordingComplete={handleAudioRecordingComplete}
              onRecordingStart={handleOtherSpeakingRecordingStart}
              maxDuration={15}
              autoUpload={true}
              disabled={isCompleted || !isAudioFinished}
              key={`recorder-${question.id}-${resetKey}`}
            />{' '}
          </div>
        );

      case PteQuestionTypeName.DESCRIBE_IMAGE:
        return (
          <div className='space-y-6'>
            {/* Image Display */}
            <div className='flex justify-center'>
              <img
                src={question.content.imageUrl}
                alt='Describe this image'
                className='max-w-full h-auto rounded-lg shadow-lg max-h-96'
              />
            </div>

            {/* Audio Recorder - Show during both preparation and recording phases */}
            <AudioRecorder
              ref={audioRecorderRef}
              onRecordingComplete={handleAudioRecordingComplete}
              onRecordingStart={handleOtherSpeakingRecordingStart}
              maxDuration={question.content.recordingTime}
              autoUpload={true}
              disabled={isCompleted}
              key={`recorder-${question.id}-${resetKey}`}
            />
          </div>
        );

      case PteQuestionTypeName.RE_TELL_LECTURE:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                ref={lectureAudioPlayerRef}
                src={question.content.audioUrl || ''}
                title='Listen to the lecture'
                autoPlay={true}
                autoPlayDelay={1000}
                onEnded={() => setIsAudioFinished(true)}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>

            {/* Audio Recorder - Show even if audio is not finished */}
            <AudioRecorder
              ref={audioRecorderRef}
              onRecordingComplete={handleAudioRecordingComplete}
              onRecordingStart={handleOtherSpeakingRecordingStart}
              maxDuration={question.content.recordingTime}
              autoUpload={true}
              disabled={isCompleted}
              key={`recorder-${question.id}-${resetKey}`}
            />
          </div>
        );

      case PteQuestionTypeName.ANSWER_SHORT_QUESTION:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen to the question'
                autoPlay={true}
                autoPlayDelay={1000}
                onEnded={() => setIsAudioFinished(true)}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>

            <AudioRecorder
              ref={audioRecorderRef}
              onRecordingComplete={handleAudioRecordingComplete}
              onRecordingStart={handleOtherSpeakingRecordingStart}
              maxDuration={10}
              autoUpload={true}
              disabled={isCompleted || !isAudioFinished}
              key={`recorder-${question.id}-${resetKey}`}
            />
            {renderListeningTips()}
          </div>
        );

      case PteQuestionTypeName.SUMMARIZE_GROUP_DISCUSSION:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                ref={lectureAudioPlayerRef}
                src={question.content.audioUrl || ''}
                title='Listen to the group discussion'
                autoPlay={true}
                autoPlayDelay={1000}
                onEnded={() => setIsAudioFinished(true)}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>

            {/* Audio Recorder - Show even if audio is not finished */}
            <AudioRecorder
              ref={audioRecorderRef}
              onRecordingComplete={handleAudioRecordingComplete}
              onRecordingStart={handleOtherSpeakingRecordingStart}
              maxDuration={question.content.recordingTime || 120}
              autoUpload={true}
              disabled={isCompleted}
              key={`recorder-${question.id}-${resetKey}`}
            />
            {renderListeningTips()}
          </div>
        );

      case PteQuestionTypeName.RESPOND_TO_A_SITUATION:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                ref={lectureAudioPlayerRef}
                src={question.content.audioUrl || ''}
                title='Listen to the situation'
                autoPlay={true}
                autoPlayDelay={1000}
                onEnded={() => setIsAudioFinished(true)}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>

            {/* Audio Recorder - Always available */}
            <AudioRecorder
              ref={audioRecorderRef}
              onRecordingComplete={handleAudioRecordingComplete}
              onRecordingStart={handleOtherSpeakingRecordingStart}
              maxDuration={question.content.recordingTime || 40}
              autoUpload={true}
              disabled={isCompleted}
              key={`recorder-${question.id}-${resetKey}`}
            />
          </div>
        );

      case PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen to the lecture'
                autoPlay={true}
                autoPlayDelay={1000}
                onEnded={() => setIsAudioFinished(true)}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>

            <div>
              <div className='flex items-center justify-between mb-2'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Your Summary
                </label>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  {response.text?.split(' ').filter((w: string) => w.length > 0)
                    .length || 0}{' '}
                  words
                </div>
              </div>
              <textarea
                value={response.text || ''}
                onChange={(e) =>
                  setResponse({ ...response, text: e.target.value })
                }
                className='w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none'
                placeholder='Write your summary here...'
                disabled={isCompleted}
              />
            </div>
            {renderListeningTips()}
          </div>
        );

      case PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT:
      case PteQuestionTypeName.WRITE_ESSAY:
        return (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
              <p className='text-base leading-relaxed text-gray-900 dark:text-white'>
                {question.content.text}
              </p>
            </div>
            <div>
              <div className='flex items-center justify-between mb-2'>
                <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Your Response
                </label>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  {response.text?.split(' ').filter((w: string) => w.length > 0)
                    .length || 0}{' '}
                  words
                </div>
              </div>
              <textarea
                value={response.text || ''}
                onChange={(e) =>
                  setResponse({ ...response, text: e.target.value })
                }
                className='w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none'
                placeholder='Write your response here...'
                disabled={isCompleted}
              />
            </div>
          </div>
        );

      case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING:
      case PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING:
        return (
          <div className='space-y-6'>
            {question.content.text && (
              <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
                <p className='text-base leading-relaxed text-gray-900 dark:text-white'>
                  {question.content.text}
                </p>
              </div>
            )}
            {question.content.audioUrl && (
              <div className='text-center'>
                <AudioPlayer
                  src={question.content.audioUrl}
                  title='Listen to the recording'
                  autoPlay={true}
                  autoPlayDelay={1000}
                  key={`audio-${question.id}-${resetKey}`}
                  questionId={question.id}
                  questionAudioText={question.content.text || ''}
                />
              </div>
            )}
            <div className='space-y-3'>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Choose the correct answer:
              </h4>
              {question.content.options?.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    response.selectedOption === option.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${isCompleted ? 'pointer-events-none' : ''}`}
                >
                  <input
                    type='radio'
                    name='single-choice'
                    value={option.id}
                    checked={response.selectedOption === option.id}
                    onChange={(e) =>
                      setResponse({
                        ...response,
                        selectedOption: e.target.value,
                      })
                    }
                    disabled={isCompleted}
                    className='mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                  />
                  <span className='text-gray-900 dark:text-white leading-relaxed'>
                    {option.text}
                  </span>
                </label>
              ))}
            </div>
            {renderListeningTips()}
          </div>
        );

      case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING:
      case PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING:
        return (
          <div className='space-y-6'>
            {question.content.text && (
              <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
                <p className='text-base leading-relaxed text-gray-900 dark:text-white'>
                  {question.content.text}
                </p>
              </div>
            )}
            {question.content.audioUrl && (
              <div className='text-center'>
                <AudioPlayer
                  src={question.content.audioUrl}
                  title='Listen to the recording'
                  autoPlay={true}
                  autoPlayDelay={1000}
                  key={`audio-${question.id}-${resetKey}`}
                  questionId={question.id}
                  questionAudioText={question.content.text || ''}
                />
              </div>
            )}
            <div className='space-y-3'>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Choose all correct answers:
              </h4>
              {question.content.options?.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    response.selectedOptions?.includes(option.id)
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${isCompleted ? 'pointer-events-none' : ''}`}
                >
                  <input
                    type='checkbox'
                    value={option.id}
                    checked={
                      response.selectedOptions?.includes(option.id) || false
                    }
                    onChange={(e) => {
                      const selectedOptions = response.selectedOptions || [];
                      if (e.target.checked) {
                        setResponse({
                          ...response,
                          selectedOptions: [...selectedOptions, option.id],
                        });
                      } else {
                        setResponse({
                          ...response,
                          selectedOptions: selectedOptions.filter(
                            (id: string) => id !== option.id
                          ),
                        });
                      }
                    }}
                    disabled={isCompleted}
                    className='mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded'
                  />
                  <span className='text-gray-900 dark:text-white leading-relaxed'>
                    {option.text}
                  </span>
                </label>
              ))}
            </div>
            {renderListeningTips()}
          </div>
        );

      case PteQuestionTypeName.RE_ORDER_PARAGRAPHS: {
        // Get paragraphs from content.paragraphs or fallback to options
        const paragraphs =
          question.content.paragraphs ||
          (question.content.options && Array.isArray(question.content.options)
            ? question.content.options.map((opt: any) => ({
                id: opt.id,
                text: opt.text,
                order: opt.correctOrder || opt.order,
              }))
            : []);

        return (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
                  Available Paragraphs
                </h4>
                <div className='space-y-3 min-h-[300px] p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600'>
                  {paragraphs
                    ?.filter(
                      (p: any) => !response.orderedParagraphs?.includes(p.id)
                    )
                    .map((paragraph: any) => (
                      <div
                        key={paragraph.id}
                        className='p-4 bg-white dark:bg-gray-800 rounded-lg cursor-move shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600'
                        draggable={!isCompleted}
                        onDragStart={(e) =>
                          e.dataTransfer.setData('text/plain', paragraph.id)
                        }
                      >
                        <p className='text-sm text-gray-900 dark:text-white leading-relaxed'>
                          {paragraph.text}
                        </p>
                      </div>
                    ))}
                  {paragraphs?.filter(
                    (p: any) => !response.orderedParagraphs?.includes(p.id)
                  ).length === 0 && (
                    <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400'>
                      <p className='text-center'>
                        All paragraphs have been ordered
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
                  Correct Order
                </h4>
                <div
                  className='min-h-[300px] p-4 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg space-y-3 bg-blue-50 dark:bg-blue-900/20'
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    if (isCompleted) return;
                    e.preventDefault();
                    const paragraphId = e.dataTransfer.getData('text/plain');
                    const dropIndex = parseInt(
                      e.dataTransfer.getData('dropIndex') || '-1'
                    );
                    const orderedParagraphs = response.orderedParagraphs || [];

                    // If it's a reorder within the correct order panel
                    if (dropIndex >= 0) {
                      const newOrderedParagraphs = [...orderedParagraphs];
                      const [movedItem] = newOrderedParagraphs.splice(
                        dropIndex,
                        1
                      );
                      newOrderedParagraphs.push(movedItem);
                      setResponse({
                        ...response,
                        orderedParagraphs: newOrderedParagraphs,
                      });
                    } else {
                      // Adding from available paragraphs
                      setResponse({
                        ...response,
                        orderedParagraphs: [...orderedParagraphs, paragraphId],
                      });
                    }
                  }}
                >
                  {response.orderedParagraphs?.length === 0 && (
                    <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400'>
                      <p className='text-center'>
                        Drag paragraphs here in the correct order
                      </p>
                    </div>
                  )}
                  {response.orderedParagraphs?.map(
                    (paragraphId: string, index: number) => {
                      const paragraph = paragraphs?.find(
                        (p: any) => p.id === paragraphId
                      );
                      return (
                        <div key={`container-${paragraphId}`}>
                          {/* Drop zone above each paragraph */}
                          <div
                            className='h-2 border-2 border-dashed border-transparent hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded mb-2'
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add(
                                'border-blue-400',
                                'bg-blue-50',
                                'dark:bg-blue-900/20'
                              );
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove(
                                'border-blue-400',
                                'bg-blue-50',
                                'dark:bg-blue-900/20'
                              );
                            }}
                            onDrop={(e) => {
                              if (isCompleted) return;
                              e.preventDefault();
                              e.stopPropagation();
                              const draggedId =
                                e.dataTransfer.getData('text/plain');
                              const draggedIndex = parseInt(
                                e.dataTransfer.getData('dropIndex') || '-1'
                              );
                              const orderedParagraphs =
                                response.orderedParagraphs || [];

                              if (draggedIndex >= 0) {
                                // Reordering within the panel
                                const newOrderedParagraphs = [
                                  ...orderedParagraphs,
                                ];
                                const [movedItem] = newOrderedParagraphs.splice(
                                  draggedIndex,
                                  1
                                );
                                newOrderedParagraphs.splice(
                                  index,
                                  0,
                                  movedItem
                                );
                                setResponse({
                                  ...response,
                                  orderedParagraphs: newOrderedParagraphs,
                                });
                              } else {
                                // Adding from available paragraphs
                                const newOrderedParagraphs = [
                                  ...orderedParagraphs,
                                ];
                                newOrderedParagraphs.splice(
                                  index,
                                  0,
                                  draggedId
                                );
                                setResponse({
                                  ...response,
                                  orderedParagraphs: newOrderedParagraphs,
                                });
                              }
                            }}
                          />

                          <div
                            className='p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm cursor-move hover:shadow-md hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-all duration-200'
                            draggable={!isCompleted}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', paragraphId);
                              e.dataTransfer.setData(
                                'dropIndex',
                                index.toString()
                              );
                              e.currentTarget.style.opacity = '0.5';
                            }}
                            onDragEnd={(e) => {
                              e.currentTarget.style.opacity = '1';
                            }}
                          >
                            <div className='flex justify-between items-start gap-3'>
                              <div className='flex items-start space-x-3'>
                                <span className='bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center'>
                                  {index + 1}
                                </span>
                                <p className='text-sm text-gray-900 dark:text-white leading-relaxed'>
                                  {paragraph?.text}
                                </p>
                              </div>
                              {!isCompleted && (
                                <button
                                  onClick={() => {
                                    const orderedParagraphs =
                                      response.orderedParagraphs.filter(
                                        (id: string) => id !== paragraphId
                                      );
                                    setResponse({
                                      ...response,
                                      orderedParagraphs,
                                    });
                                  }}
                                  className='text-red-600 hover:text-red-800 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors'
                                >
                                  <X className='w-4 h-4' />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}

                  {/* Drop zone at the end */}
                  {response.orderedParagraphs?.length > 0 && (
                    <div
                      className='h-4 border-2 border-dashed border-transparent hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded mt-2'
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add(
                          'border-blue-400',
                          'bg-blue-50',
                          'dark:bg-blue-900/20'
                        );
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove(
                          'border-blue-400',
                          'bg-blue-50',
                          'dark:bg-blue-900/20'
                        );
                      }}
                      onDrop={(e) => {
                        if (isCompleted) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const draggedId = e.dataTransfer.getData('text/plain');
                        const draggedIndex = parseInt(
                          e.dataTransfer.getData('dropIndex') || '-1'
                        );
                        const orderedParagraphs =
                          response.orderedParagraphs || [];

                        if (draggedIndex >= 0) {
                          // Reordering within the panel - move to end
                          const newOrderedParagraphs = [...orderedParagraphs];
                          const [movedItem] = newOrderedParagraphs.splice(
                            draggedIndex,
                            1
                          );
                          newOrderedParagraphs.push(movedItem);
                          setResponse({
                            ...response,
                            orderedParagraphs: newOrderedParagraphs,
                          });
                        } else {
                          // Adding from available paragraphs to end
                          setResponse({
                            ...response,
                            orderedParagraphs: [
                              ...orderedParagraphs,
                              draggedId,
                            ],
                          });
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case PteQuestionTypeName.READING_FILL_IN_THE_BLANKS:
        return (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
              <h4 className='font-medium text-gray-900 dark:text-white mb-4'>
                Click on each blank to select the correct word:
              </h4>
              <div className='text-base leading-relaxed text-gray-900 dark:text-white'>
                {question.content.text
                  ?.split('_____')
                  .map((part, index, array) => {
                    const blankOptions =
                      question.content.blanks?.[index]?.options || [];
                    const selectedValue =
                      response.blanks?.[`blank${index + 1}`] || '';
                    return (
                      <span key={index}>
                        {part}
                        {index < array.length - 1 && (
                          <span className='inline-block relative'>
                            <select
                              value={selectedValue}
                              onChange={(e) =>
                                setResponse({
                                  ...response,
                                  blanks: {
                                    ...response.blanks,
                                    [`blank${index + 1}`]: e.target.value,
                                  },
                                })
                              }
                              disabled={isCompleted}
                              className={`
                                inline-block mx-1 px-2 py-1 text-sm font-medium rounded-md border-2
                                transition-all duration-200 cursor-pointer min-w-[100px] max-w-[140px]
                                ${
                                  selectedValue
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-200'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                                }
                                hover:border-blue-400 dark:hover:border-blue-500
                                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                disabled:opacity-50 disabled:cursor-not-allowed
                              `}
                            >
                              <option
                                value=''
                                className='text-gray-500 dark:text-gray-400'
                              >
                                {selectedValue ? selectedValue : '___'}
                              </option>
                              {blankOptions.length > 0 ? (
                                blankOptions.map((option: string) => (
                                  <option
                                    key={option}
                                    value={option}
                                    className='text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                                  >
                                    {option}
                                  </option>
                                ))
                              ) : (
                                <option
                                  value=''
                                  disabled
                                  className='text-gray-400'
                                >
                                  No options
                                </option>
                              )}
                            </select>
                          </span>
                        )}
                      </span>
                    );
                  })}
              </div>
            </div>

            {/* Show available options for reference */}
            {/* {question.content.blanks && question.content.blanks.length > 0 && (
              <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'>
                <h4 className='font-medium text-gray-900 dark:text-white mb-3 text-sm'>
                  Available Options by Blank
                </h4>
                <div className='space-y-2'>
                  {question.content.blanks.map((blank: any, index: number) => (
                    <div
                      key={blank.id || index}
                      className='flex flex-wrap gap-2'
                    >
                      <span className='text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[60px]'>
                        Blank {index + 1}:
                      </span>
                      {blank.options?.map(
                        (option: string, optIndex: number) => (
                          <span
                            key={optIndex}
                            className='px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-sm'
                          >
                            {option}
                          </span>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        );

      case PteQuestionTypeName.FILL_IN_THE_BLANKS_DRAG_AND_DROP: {
        // Get all available options from all blanks
        const allOptions =
          question.content.blanks?.flatMap((blank) => blank.options || []) ||
          [];
        const uniqueOptions = [...new Set(allOptions)]; // Remove duplicates

        // Track which options are used
        const usedOptions = Object.values(response.blanks || {}).filter(
          Boolean
        );

        return (
          <div className='space-y-6'>
            {/* Text with drag and drop blanks */}
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
              <h4 className='font-medium text-gray-900 dark:text-white mb-4'>
                Drag words from the box below to fill in the blanks:
              </h4>
              <div className='text-base leading-relaxed text-gray-900 dark:text-white'>
                {question.content.text
                  ?.split('_____')
                  .map((part, index, array) => {
                    const selectedValue =
                      response.blanks?.[`blank${index + 1}`] || '';
                    return (
                      <span key={index}>
                        {part}
                        {index < array.length - 1 && (
                          <span className='inline-block relative mx-1'>
                            <div
                              className={`inline-block min-w-[120px] px-3 py-2 border-2 border-dashed rounded-lg text-center transition-all duration-200 ${
                                selectedValue
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                              } ${isCompleted ? 'pointer-events-none' : ''}`}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                if (isCompleted) return;
                                e.preventDefault();
                                const draggedWord =
                                  e.dataTransfer.getData('text/plain');
                                if (draggedWord) {
                                  setResponse({
                                    ...response,
                                    blanks: {
                                      ...response.blanks,
                                      [`blank${index + 1}`]: draggedWord,
                                    },
                                  });
                                }
                              }}
                            >
                              {selectedValue ? (
                                <span
                                  className='cursor-pointer font-medium'
                                  draggable={!isCompleted}
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData(
                                      'text/plain',
                                      selectedValue
                                    );
                                    e.dataTransfer.setData('source', 'blank');
                                    e.dataTransfer.setData(
                                      'blankId',
                                      `blank${index + 1}`
                                    );
                                  }}
                                  onClick={() => {
                                    if (!isCompleted) {
                                      // Remove word from blank on click
                                      const newBlanks = { ...response.blanks };
                                      delete newBlanks[`blank${index + 1}`];
                                      setResponse({
                                        ...response,
                                        blanks: newBlanks,
                                      });
                                    }
                                  }}
                                >
                                  {selectedValue}
                                </span>
                              ) : (
                                <span className='text-gray-400 dark:text-gray-500 text-sm'>
                                  Drop here
                                </span>
                              )}
                            </div>
                          </span>
                        )}
                      </span>
                    );
                  })}
              </div>
            </div>

            {/* Available words box */}
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
              <h5 className='font-medium text-gray-900 dark:text-white mb-4'>
                Available Words:
              </h5>
              <div
                className='flex flex-wrap gap-3 min-h-[60px] p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700'
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (isCompleted) return;
                  e.preventDefault();
                  // const draggedWord = e.dataTransfer.getData('text/plain');
                  const source = e.dataTransfer.getData('source');
                  const blankId = e.dataTransfer.getData('blankId');

                  if (source === 'blank' && blankId) {
                    // Remove word from blank when dropped back to available words
                    const newBlanks = { ...response.blanks };
                    delete newBlanks[blankId];
                    setResponse({
                      ...response,
                      blanks: newBlanks,
                    });
                  }
                }}
              >
                {uniqueOptions.map((option, index) => {
                  const isUsed = usedOptions.includes(option);
                  return (
                    <div
                      key={index}
                      className={`px-4 py-2 rounded-lg border cursor-move transition-all duration-200 ${
                        isUsed
                          ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-500 opacity-50'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                      } ${isCompleted ? 'pointer-events-none' : ''}`}
                      draggable={!isUsed && !isCompleted}
                      onDragStart={(e) => {
                        if (!isUsed) {
                          e.dataTransfer.setData('text/plain', option);
                          e.dataTransfer.setData('source', 'available');
                        }
                      }}
                    >
                      {option}
                    </div>
                  );
                })}
                {uniqueOptions.length === 0 && (
                  <p className='text-gray-500 dark:text-gray-400 text-sm italic'>
                    No words available
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      }

      case PteQuestionTypeName.LISTENING_FILL_IN_THE_BLANKS:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen and fill in the blanks'
                autoPlay={true}
                autoPlayDelay={1000}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
              <h4 className='font-medium text-gray-900 dark:text-white mb-4'>
                Listen carefully and type the missing words in the blanks:
              </h4>
              <div className='text-base leading-relaxed text-gray-900 dark:text-white'>
                {question.content.text
                  ?.split('_____')
                  .map((part, index, array) => {
                    const userInput =
                      response.blanks?.[`blank${index + 1}`] || '';
                    return (
                      <span key={index}>
                        {part}
                        {index < array.length - 1 && (
                          <span className='inline-block relative'>
                            <input
                              type='text'
                              value={userInput}
                              onChange={(e) =>
                                setResponse({
                                  ...response,
                                  blanks: {
                                    ...response.blanks,
                                    [`blank${index + 1}`]: e.target.value,
                                  },
                                })
                              }
                              disabled={isCompleted}
                              placeholder='___'
                              className={`
                                inline-block mx-1 px-2 py-1 text-sm font-medium rounded-md border-2
                                transition-all duration-200 min-w-[80px] max-w-[120px] text-center
                                ${
                                  userInput.trim()
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-200'
                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                                }
                                hover:border-blue-400 dark:hover:border-blue-500
                                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                disabled:opacity-50 disabled:cursor-not-allowed
                                placeholder:text-gray-400 dark:placeholder:text-gray-500
                              `}
                            />
                          </span>
                        )}
                      </span>
                    );
                  })}
              </div>
            </div>

            {renderListeningTips()}
          </div>
        );

      case PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen to the recording'
                autoPlay={true}
                autoPlayDelay={1000}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>
            <div className='space-y-3'>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Choose the best summary:
              </h4>
              {question.content.options?.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    response.selectedSummary === option.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${isCompleted ? 'pointer-events-none' : ''}`}
                >
                  <input
                    type='radio'
                    name='summary-choice'
                    value={option.id}
                    checked={response.selectedSummary === option.id}
                    onChange={(e) =>
                      setResponse({
                        ...response,
                        selectedSummary: e.target.value,
                      })
                    }
                    disabled={isCompleted}
                    className='mt-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                  />
                  <div className='flex-1'>
                    <p className='text-gray-900 dark:text-white leading-relaxed'>
                      {option.text}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {renderListeningTips()}
          </div>
        );

      case PteQuestionTypeName.SELECT_MISSING_WORD:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen and select the missing word'
                autoPlay={true}
                autoPlayDelay={1000}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>
            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900 dark:text-white text-center'>
                Select the missing word:
              </h4>
              <div className='space-y-3 max-w-md mx-auto'>
                {question.content.options?.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      response.selectedWord === option.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${isCompleted ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type='radio'
                      name='missing-word'
                      value={option.id}
                      checked={response.selectedWord === option.id}
                      onChange={() =>
                        !isCompleted &&
                        setResponse({ ...response, selectedWord: option.id })
                      }
                      disabled={isCompleted}
                      className='w-4 h-4 text-blue-600 dark:text-blue-400 accent-blue-600 dark:accent-blue-400 cursor-pointer'
                    />
                    <span className='ml-3 text-gray-900 dark:text-white font-medium'>
                      {option.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {renderListeningTips()}
          </div>
        );

      case PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen and highlight incorrect words'
                autoPlay={true}
                autoPlayDelay={1000}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
              <h4 className='font-medium text-gray-900 dark:text-white mb-4'>
                Click on words that are different from what you heard:
              </h4>
              <div className='text-lg leading-relaxed'>
                {question.content.text?.split(' ').map((word, index) => {
                  const wordId = `word-${index}`;
                  const highlightedWordIds = response.highlightedWordIds || [];
                  const isHighlighted = highlightedWordIds.includes(wordId);

                  return (
                    <span
                      key={index}
                      onClick={() => {
                        if (isCompleted) return;

                        if (isHighlighted) {
                          // Remove this specific word instance
                          const wordIdIndex =
                            highlightedWordIds.indexOf(wordId);
                          const newHighlightedWordIds =
                            highlightedWordIds.filter(
                              (id: string) => id !== wordId
                            );
                          const newHighlightedWords = (
                            response.highlightedWords || []
                          ).filter((_: any, i: number) => i !== wordIdIndex);
                          setResponse({
                            ...response,
                            highlightedWordIds: newHighlightedWordIds,
                            highlightedWords: newHighlightedWords,
                          });
                        } else {
                          // Add this specific word instance
                          setResponse({
                            ...response,
                            highlightedWordIds: [...highlightedWordIds, wordId],
                            highlightedWords: [
                              ...(response.highlightedWords || []),
                              word,
                            ],
                          });
                        }
                      }}
                      className={`cursor-pointer py-1 px-1.5 mx-0.5 rounded-md transition-all duration-200 inline-block ${
                        isHighlighted
                          ? 'bg-red-300 dark:bg-red-800 text-red-900 dark:text-red-100 shadow-md font-semibold'
                          : 'text-gray-900 dark:text-white hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:shadow-sm'
                      } ${isCompleted ? 'pointer-events-none' : ''}`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
              <div className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
                Selected words: {response.highlightedWords?.length || 0}
              </div>
              {renderListeningTips()}
            </div>
          </div>
        );

      case PteQuestionTypeName.WRITE_FROM_DICTATION:
        return (
          <div className='space-y-6'>
            <div className='text-center'>
              <AudioPlayer
                src={question.content.audioUrl || ''}
                title='Listen and type the sentence'
                autoPlay={true}
                autoPlayDelay={1000}
                key={`audio-${question.id}-${resetKey}`}
                questionId={question.id}
                questionAudioText={question.content.text || ''}
              />
            </div>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600'>
              <label className='block font-medium text-gray-700 dark:text-gray-300 mb-4'>
                Type exactly what you hear:
              </label>
              <input
                type='text'
                value={response.text || ''}
                onChange={(e) =>
                  setResponse({ ...response, text: e.target.value })
                }
                disabled={isCompleted}
                className='w-full p-4 text-lg border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white'
                placeholder='Type the sentence here...'
              />
              <div className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                Words typed:{' '}
                {response.text?.split(' ').filter((w: string) => w.length > 0)
                  .length || 0}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className='text-center py-8'>
            <p className='text-gray-600 dark:text-gray-300'>
              Question type not implemented yet.
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}
    >
      {/* Compact Header */}
      <div className='flex items-center justify-between p-4 border-b dark:border-gray-700'>
        <div>
          <h2 className='text-lg font-bold text-gray-900 dark:text-white'>
            {question.title}
          </h2>
          <p className='text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
            {question.type === 'FILL_IN_THE_BLANKS_DRAG_AND_DROP'
              ? 'Fill in the Blanks (Drag and Drop)'
              : question.type
                  .replace(/_/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
          </p>
        </div>
        <div className='flex items-center space-x-4'>
          {/* Only show timer for specific question types */}
          {shouldShowTimer && (
            <>
              {isPreparationPhase && !hasUserStartedRecording && (
                <div className='flex items-center space-x-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800'>
                  <Clock className='h-4 w-4 text-orange-600 dark:text-orange-400' />
                  <div>
                    <div className='text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide'>
                      Preparation
                    </div>
                    <div className='font-mono text-sm font-bold text-orange-700 dark:text-orange-300'>
                      {formatTime(preparationTime)}
                    </div>
                  </div>
                </div>
              )}
              {(!isPreparationPhase || hasUserStartedRecording) &&
                timeLeft > 0 && (
                  <div className='flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800'>
                    <Clock className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                    <div>
                      <div className='text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide'>
                        Time Left
                      </div>
                      <div className='font-mono text-sm font-bold text-blue-700 dark:text-blue-300'>
                        {formatTime(timeLeft)}
                      </div>
                    </div>
                  </div>
                )}
            </>
          )}
          {isCompleted && (
            <div className='flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800'>
              <CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
              <span className='text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wide'>
                Completed
              </span>
            </div>
          )}
        </div>
      </div>

      <div className='p-6'>
        {/* Compact Instructions */}
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-800'>
          <div className='flex items-start space-x-3'>
            <div className='bg-blue-600 p-2 rounded-lg'>
              <AlertCircle className='h-4 w-4 text-white' />
            </div>
            <div>
              <h3 className='font-bold text-blue-900 dark:text-blue-100 mb-2'>
                Instructions
              </h3>
              <p className='text-blue-800 dark:text-blue-200 text-sm leading-relaxed'>
                {question.instructions}
              </p>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className='mb-6'>{renderQuestionContent()}</div>

        {/* Status Messages */}
        <div className='space-y-3 mb-6'>
          {/* Audio Processing Status */}
          {isProcessingAudio && (
            <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700'>
              <div className='flex items-center justify-center space-x-3'>
                <Loader className='h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin' />
                <span className='text-blue-800 dark:text-blue-200 font-medium'>
                  Processing and evaluating your audio response...
                </span>
              </div>
            </div>
          )}

          {/* Audio ready for review message */}
          {!isCompleted &&
            !isPreparationPhase &&
            isAudioBasedQuestion &&
            isAudioReady &&
            !isSubmitting && (
              <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700'>
                <p className='text-green-800 dark:text-green-200 text-sm font-medium'>
                  ✅ Audio uploaded successfully! Review your recording above
                  and click "Submit for Evaluation" when ready.
                </p>
              </div>
            )}
        </div>

        {/* Actions */}
        <div className='flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700'>
          <button
            onClick={handleReset}
            disabled={isSubmitting || isProcessingAudio}
            className='flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <RotateCcw className='h-4 w-4' />
            <span className='font-medium'>Reset</span>
          </button>

          <div className='flex space-x-3'>
            {!isCompleted && (
              <>
                {/* For audio-based questions, only show submit button when audio is ready */}
                {isAudioBasedQuestion ? (
                  isAudioReady && (
                    <button
                      onClick={handleManualSubmit}
                      disabled={isSubmitting || isProcessingAudio}
                      className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isSubmitting ? (
                        <div className='flex items-center space-x-2'>
                          <Loader className='h-4 w-4 animate-spin' />
                          <span>Evaluating...</span>
                        </div>
                      ) : (
                        'Submit for Evaluation'
                      )}
                    </button>
                  )
                ) : (
                  /* For non-audio questions, show regular submit button */
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? (
                      <div className='flex items-center space-x-2'>
                        <Loader className='h-4 w-4 animate-spin' />
                        <span>Processing & Evaluating...</span>
                      </div>
                    ) : (
                      'Submit'
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Evaluation Results */}
        {isCompleted && evaluationResult && (
          <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
            <QuestionResponseEvaluator
              evaluation={evaluationResult}
              questionType={question.type}
              transcribedText={
                response.transcribedText || response.evaluation?.transcribedText
              }
              question={question}
            />
          </div>
        )}

        {/* Unified Navigation Section - Always visible in a dedicated area when navigation is available */}
        {(onNext || onPrevious) && (
          <div className='mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
            <div className='flex justify-between items-center gap-4'>
              <div>
                {onPrevious && hasPrevious && (
                  <button
                    onClick={onPrevious}
                    className='bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl'
                  >
                    ← Previous
                  </button>
                )}
              </div>
              <div>
                {onNext && hasNext && (
                  <button
                    onClick={onNext}
                    className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl'
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Previous Responses Section */}
        <div className='border-t border-gray-200 dark:border-gray-700 pt-4 my-5'>
          <button
            onClick={togglePreviousResponses}
            className='flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4'
          >
            <History className='h-5 w-5' />
            <span className='font-medium'>Previous Attempts</span>
            {showPreviousResponses ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </button>

          {showPreviousResponses && (
            <div className='mb-4'>
              <PreviousResponses
                questionId={question.id}
                onViewResponse={handleViewResponse}
                className='border border-gray-200 dark:border-gray-600'
              />
            </div>
          )}
        </div>
      </div>

      {/* Response Detail Modal */}
      <ResponseDetailModal
        response={selectedResponse}
        isOpen={showResponseModal}
        onClose={handleCloseResponseModal}
        questionType={question.type}
      />
    </div>
  );
};

export default PracticeQuestion;
