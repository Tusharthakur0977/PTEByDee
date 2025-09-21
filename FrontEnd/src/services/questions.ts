import api from './api';

export interface CreateQuestionData {
  questionCode?: string; // Made optional for auto-generation
  questionTypeId: string;
  testId: string;
  orderInTest?: number;
  difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD';
  textContent?: string;
  audioKey?: string;
  imageKey?: string;
  options?: any;
  correctAnswers?: any;
  wordCountMin?: number;
  wordCountMax?: number;
  durationMillis?: number;
  originalTextWithErrors?: string;
  incorrectWords?: any;
}

// Removed redundant UpdateQuestionData interface

export interface QuestionFilters {
  page?: number;
  limit?: number;
  search?: string;
  questionType?: string;
  testId?: string;
  sectionId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class QuestionsService {
  /**
   * Get all questions with filtering and pagination
   */
  async getQuestions(filters: QuestionFilters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/admin/questions?${params}`);
    return response.data;
  }

  /**
   * Get a single question by ID
   */
  async getQuestionById(id: string) {
    const response = await api.get(`/admin/questions/${id}`);
    return response.data;
  }

  /**
   * Create a new question
   */
  async createQuestion(data: CreateQuestionData) {
    const response = await api.post('/admin/questions', data);
    return response.data;
  }

  /**
   * Update an existing question
   */
  async updateQuestion(id: string, data: Partial<CreateQuestionData>) {
    const response = await api.put(`/admin/questions/${id}`, data);
    return response.data;
  }

  /**
   * Delete a question
   */
  async deleteQuestion(id: string) {
    const response = await api.delete(`/admin/questions/${id}`);
    return response.data;
  }

  /**
   * Get all question types grouped by PTE section
   */
  async getQuestionTypes() {
    const response = await api.get('/admin/question-types');
    return response.data;
  }

  /**
   * Get all tests for question assignment
   */
  async getTests() {
    const response = await api.get('/admin/tests');
    return response.data;
  }

  /**
   * Get the next question code for a specific question type
   */
  async getNextQuestionCode(questionTypeId: string) {
    const response = await api.get(
      `/admin/questions/next-code/${questionTypeId}`
    );
    return response.data;
  }

  /**
   * Upload audio file for question
   */
  async uploadQuestionAudio(file: File) {
    const formData = new FormData();
    formData.append('questionAudio', file);

    const response = await api.post('/admin/upload/question-audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Upload image file for question
   */
  async uploadQuestionImage(file: File) {
    const formData = new FormData();
    formData.append('questionImage', file);

    const response = await api.post('/admin/upload/question-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Bulk delete questions
   */
  async bulkDeleteQuestions(questionIds: string[]) {
    const response = await api.delete('/admin/questions/bulk', {
      data: { questionIds },
    });
    return response.data;
  }

  /**
   * Get question statistics
   */
  async getQuestionStats() {
    const response = await api.get('/admin/questions/stats');
    return response.data;
  }
}

export const questionsService = new QuestionsService();
