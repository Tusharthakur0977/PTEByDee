import api from './api';

export interface LessonProgress {
  id: string;
  title: string;
  order: number;
  isCompleted: boolean;
  completedAt?: string;
  lastAccessedAt?: string;
  watchedDuration?: number;
}

export interface SectionProgress {
  id: string;
  title: string;
  order: number;
  isCompleted: boolean;
  completedAt?: string;
  lastAccessedAt?: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lessons: LessonProgress[];
}

export interface CourseProgress {
  course: {
    id: string;
    title: string;
    overallProgress: number;
    isCompleted: boolean;
    enrolledAt: string;
    completedAt?: string;
  };
  sections: SectionProgress[];
  statistics: {
    totalSections: number;
    completedSections: number;
    totalLessons: number;
    completedLessons: number;
    overallProgress: number;
    timeSpent: number;
  };
}

export interface ProgressOverview {
  statistics: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalLessons: number;
    completedLessons: number;
    averageProgress: number;
    totalTimeSpent: number;
  };
  courses: Array<{
    id: string;
    title: string;
    imageUrl?: string;
    progress: number;
    isCompleted: boolean;
    enrolledAt: string;
    completedAt?: string;
    totalLessons: number;
  }>;
  recentActivity: Array<{
    id: string;
    lessonTitle: string;
    sectionTitle: string;
    courseTitle: string;
    courseId: string;
    isCompleted: boolean;
    lastAccessedAt: string;
    completedAt?: string;
  }>;
}

// Update lesson progress
export const updateLessonProgress = async (
  lessonId: string,
  data: {
    isCompleted?: boolean;
    watchedDuration?: number;
  }
) => {
  const response = await api.post(`/user/lessons/${lessonId}/progress`, data);
  return response.data;
};

// Get user's progress for a specific course
export const getUserProgress = async (
  courseId: string
): Promise<CourseProgress> => {
  const response = await api.get(`/user/courses/${courseId}/progress`);
  return response.data.data;
};

// Get user's overall progress overview
export const getUserProgressOverview = async (): Promise<ProgressOverview> => {
  const response = await api.get('/user/progress/overview');
  return response.data.data;
};

// Mark lesson as completed
export const markLessonCompleted = async (lessonId: string) => {
  return updateLessonProgress(lessonId, { isCompleted: true });
};

// Update video watch time
export const updateVideoWatchTime = async (
  lessonId: string,
  watchedDuration: number
) => {
  return updateLessonProgress(lessonId, { watchedDuration });
};
