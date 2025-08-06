import { useCallback, useEffect, useState } from 'react';
import type { CourseProgress, ProgressOverview } from '../services/progress';
import {
  getUserProgress,
  getUserProgressOverview,
  updateLessonProgress,
} from '../services/progress';

export const useProgress = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProgress = useCallback(
    async (
      lessonId: string,
      data: { isCompleted?: boolean; watchedDuration?: number }
    ) => {
      try {
        setError(null);
        const result = await updateLessonProgress(lessonId, data);
        return result;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || 'Failed to update progress';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    []
  );

  return {
    updateProgress,
    isLoading,
    error,
  };
};

export const useCourseProgress = (
  courseId: string,
  shouldFetch: boolean = true
) => {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!courseId || !shouldFetch) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const progressData = await getUserProgress(courseId);
      setProgress(progressData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to fetch progress';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, shouldFetch]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const refreshProgress = useCallback(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    isLoading,
    error,
    refreshProgress,
  };
};

export const useProgressOverview = () => {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const overviewData = await getUserProgressOverview();
      setOverview(overviewData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to fetch progress overview';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const refreshOverview = useCallback(() => {
    fetchOverview();
  }, [fetchOverview]);

  return {
    overview,
    isLoading,
    error,
    refreshOverview,
  };
};
