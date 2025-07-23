import api from './api';

export interface CourseSection {
  id?: string;
  title: string;
  description?: string;
  videoUrl?: string;
  videoKey?: string; // S3 key for secure video storage
  order?: number;
  lessons?: CourseLesson[];
}

export interface CourseLesson {
  id?: string;
  title: string;
  description?: string;
  videoUrl?: string;
  videoKey?: string; // S3 key for secure video storage
  textContent?: string;
  audioUrl?: string;
  order?: number;
}

export interface CreateCourseData {
  title: string;
  description: string;
  coursePreviewVideoUrl?: string;
  isFree: boolean;
  imageUrl?: string;
  price?: number;
  currency?: string;
  categoryIds?: string[];
  sections?: CourseSection[];
}

export interface UpdateCourseData extends CreateCourseData {
  id: string;
}

export interface CourseFilters {
  page?: number;
  limit?: number;
  search?: string;
  isFree?: boolean;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  courseCount?: number;
  createdAt: string;
  updatedAt: string;
}

// User Management
export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

// Course Management
export const getAllCourses = async (filters: CourseFilters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/admin/courses?${params.toString()}`);
  return response.data;
};

export const getCourseById = async (id: string) => {
  const response = await api.get(`/admin/courses/${id}`);
  return response.data;
};

export const createCourse = async (courseData: CreateCourseData) => {
  const response = await api.post('/admin/courses', courseData);
  return response.data;
};

export const updateCourse = async (
  id: string,
  courseData: Partial<CreateCourseData>
) => {
  const response = await api.put(`/admin/courses/${id}`, courseData);
  return response.data;
};

export const deleteCourse = async (id: string) => {
  const response = await api.delete(`/admin/courses/${id}`);
  return response.data;
};

export const bulkDeleteCourses = async (courseIds: string[]) => {
  const response = await api.delete('/admin/courses/bulk', {
    data: { courseIds },
  });
  return response.data;
};

export const getCourseStats = async () => {
  const response = await api.get('/admin/courses/stats');
  return response.data;
};

// Category Management
export const getCategories = async () => {
  const response = await api.get('/admin/categories');
  return response.data;
};

export const createCategory = async (categoryData: {
  name: string;
  slug: string;
  description?: string;
}) => {
  const response = await api.post('/admin/categories', categoryData);
  return response.data;
};
