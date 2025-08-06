import api, { publicApi } from './api';

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
  videoUrl?: string;
  videoKey?: string; // S3 key for secure video storage
  order: number;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  videoUrl?: string;
  audioUrl?: string;
  textContent?: string;
  type: 'video' | 'audio' | 'text' | 'quiz' | 'assignment';
  isPreview?: boolean;
  duration?: string;
}

export interface CourseCurriculum {
  title: string;
  lessons: {
    title: string;
    duration?: string;
    videoUrl?: string;
    audioUrl?: string;
    type: 'video' | 'audio' | 'text' | 'quiz' | 'assignment';
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

  // Use publicApi for public course listing (no auth required)
  const response = await publicApi.get(`/user/courses?${params.toString()}`);

  console.log(response, 'XXX');

  return response.data.data;
};

// Get course by ID
export const getCourseById = async (id: string): Promise<Course> => {
  // Use publicApi for public course details (no auth required)
  const response = await publicApi.get(`/user/courses/${id}`);
  return response.data.data;
};

// Enroll in a course
export const enrollInCourse = async (courseId: string) => {
  const response = await api.post(`/user/courses/${courseId}/enroll`);
  return response.data;
};

// Get user's enrolled courses
export const getEnrolledCourses = async (): Promise<{
  courses: Course[];
  totalEnrolled: number;
}> => {
  const response = await api.get('/user/enrolled-courses');
  return response.data.data;
};

// Get secure video URL for enrolled users
export const getSecureVideoUrl = async (
  videoKey: string,
  courseId: string
): Promise<{
  videoKey: string;
  secureUrl: string;
  expiresAt: string;
  expirationHours: number;
}> => {
  const response = await api.post('/user/secure-video-url', {
    videoKey,
    courseId,
  });
  return response.data.data;
};

// Test enrollment endpoint for debugging
export const testEnrollment = async () => {
  const response = await api.get('/user/test-enrollment');
  return response.data;
};

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  // Use publicApi for public categories
  const response = await publicApi.get('/user/categories');
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
