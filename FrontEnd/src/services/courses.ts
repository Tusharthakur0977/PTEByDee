import api from './api';

export interface Course {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  imageUrl?: string;
  coursePreviewVideoUrl?: string;
  isFree: boolean;
  price: number;
  currency?: string;
  averageRating: number;
  reviewCount: number;
  enrollmentCount: number;
  sectionCount: number;
  createdAt: string;
  updatedAt: string;

  // Frontend compatibility fields
  rating: number;
  students: number;
  level: string;
  duration: string;

  // User-specific data
  isEnrolled?: boolean;
  userEnrollment?: {
    id: string;
    progress: number;
    completed: boolean;
    enrolledAt: string;
    completedAt?: string;
  };

  // Course content
  sections?: CourseSection[];
  reviews?: CourseReview[];
  instructor?: {
    name: string;
    bio: string;
    experience: string;
  };
  features?: string[];
  curriculum?: CourseCurriculum[];
}

export interface CourseSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  videoUrl?: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  isPreview?: boolean;
  duration?: string;
}

export interface CourseCurriculum {
  title: string;
  lessons: {
    title: string;
    duration?: string;
    videoUrl?: string;
    type: 'video' | 'text' | 'quiz' | 'assignment';
    isPreview?: boolean;
  }[];
}

export interface CourseReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  search?: string;
  isFree?: boolean;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  level?: string;
}

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCourses: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  filters: {
    search: string;
    isFree: string;
    categoryId: string;
    sortBy: string;
    sortOrder: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}

// Get all courses with filtering and pagination
export const getCourses = async (
  filters: CourseFilters = {}
): Promise<CoursesResponse> => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/user/courses?${params.toString()}`);
  return response.data.data;
};

// Get course by ID
export const getCourseById = async (id: string): Promise<Course> => {
  const response = await api.get(`/user/courses/${id}`);
  return response.data.data;
};

// Enroll in a course
export const enrollInCourse = async (courseId: string) => {
  const response = await api.post(`/user/courses/${courseId}/enroll`);
  return response.data;
};

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/user/categories');
  return response.data.data;
};

// Search courses
export const searchCourses = async (
  query: string,
  filters: Partial<CourseFilters> = {}
): Promise<CoursesResponse> => {
  return getCourses({
    ...filters,
    search: query,
  });
};

// Get featured courses
export const getFeaturedCourses = async (
  limit: number = 6
): Promise<Course[]> => {
  const response = await getCourses({
    limit,
    sortBy: 'averageRating',
    sortOrder: 'desc',
  });
  return response.courses;
};

// Get free courses
export const getFreeCourses = async (limit: number = 6): Promise<Course[]> => {
  const response = await getCourses({
    limit,
    isFree: true,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  return response.courses;
};
