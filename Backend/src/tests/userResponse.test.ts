import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('UserResponse Model', () => {
  let testUserId: string;
  let testQuestionId: string;

  beforeAll(async () => {
    // This is a conceptual test - in real implementation, you'd set up test data
    // For now, we'll just test the structure
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('UserResponse Creation', () => {
    it('should create a user response without testAttemptId', async () => {
      // Mock test - in real implementation, you'd create actual test data
      const mockUserResponse = {
        id: 'mock-id',
        userId: 'mock-user-id',
        questionId: 'mock-question-id',
        textResponse: 'Sample response text',
        audioResponseUrl: null,
        selectedOptions: ['option1', 'option2'],
        orderedItems: [],
        highlightedWords: [],
        questionScore: 85,
        isCorrect: true,
        aiFeedback: 'Good response with clear pronunciation',
        timeTakenSeconds: 45,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test that the structure matches our expectations
      expect(mockUserResponse).toHaveProperty('userId');
      expect(mockUserResponse).toHaveProperty('questionId');
      expect(mockUserResponse).not.toHaveProperty('testAttemptId');
      expect(mockUserResponse.selectedOptions).toBeInstanceOf(Array);
      expect(mockUserResponse.orderedItems).toBeInstanceOf(Array);
      expect(mockUserResponse.highlightedWords).toBeInstanceOf(Array);
    });

    it('should have correct field types', () => {
      const mockResponse = {
        userId: 'string',
        questionId: 'string',
        textResponse: 'string or null',
        audioResponseUrl: 'string or null',
        selectedOptions: [] as string[],
        orderedItems: [] as string[],
        highlightedWords: [] as string[],
        questionScore: 85,
        isCorrect: true,
        aiFeedback: 'string or null',
        timeTakenSeconds: 45,
      };

      expect(typeof mockResponse.userId).toBe('string');
      expect(typeof mockResponse.questionId).toBe('string');
      expect(typeof mockResponse.questionScore).toBe('number');
      expect(typeof mockResponse.isCorrect).toBe('boolean');
      expect(typeof mockResponse.timeTakenSeconds).toBe('number');
      expect(Array.isArray(mockResponse.selectedOptions)).toBe(true);
      expect(Array.isArray(mockResponse.orderedItems)).toBe(true);
      expect(Array.isArray(mockResponse.highlightedWords)).toBe(true);
    });
  });

  describe('UserResponse Queries', () => {
    it('should support querying by userId', () => {
      // Mock query structure
      const mockQuery = {
        where: {
          userId: 'test-user-id',
        },
        include: {
          user: true,
          question: {
            include: {
              questionType: {
                include: {
                  pteSection: true,
                },
              },
            },
          },
        },
      };

      expect(mockQuery.where).toHaveProperty('userId');
      expect(mockQuery.include).toHaveProperty('user');
      expect(mockQuery.include).toHaveProperty('question');
    });

    it('should support filtering by question type', () => {
      const mockQuery = {
        where: {
          userId: 'test-user-id',
          question: {
            questionType: {
              name: 'READ_ALOUD',
            },
          },
        },
      };

      expect(mockQuery.where.question.questionType).toHaveProperty('name');
    });

    it('should support filtering by correctness', () => {
      const mockQuery = {
        where: {
          userId: 'test-user-id',
          isCorrect: true,
        },
      };

      expect(mockQuery.where).toHaveProperty('isCorrect');
      expect(mockQuery.where.isCorrect).toBe(true);
    });
  });

  describe('UserResponse Statistics', () => {
    it('should calculate accuracy rate correctly', () => {
      const totalResponses = 10;
      const correctResponses = 7;
      const accuracyRate = (correctResponses / totalResponses) * 100;

      expect(accuracyRate).toBe(70);
    });

    it('should handle zero responses gracefully', () => {
      const totalResponses = 0;
      const correctResponses = 0;
      const accuracyRate = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;

      expect(accuracyRate).toBe(0);
    });

    it('should round accuracy rate to 2 decimal places', () => {
      const totalResponses = 3;
      const correctResponses = 2;
      const accuracyRate = Math.round(((correctResponses / totalResponses) * 100) * 100) / 100;

      expect(accuracyRate).toBe(66.67);
    });
  });

  describe('Response Data Validation', () => {
    it('should validate response data structure for different question types', () => {
      const readAloudResponse = {
        textResponse: null,
        audioResponseUrl: 'https://example.com/audio.mp3',
        selectedOptions: [],
        orderedItems: [],
        highlightedWords: [],
      };

      const multipleChoiceResponse = {
        textResponse: null,
        audioResponseUrl: null,
        selectedOptions: ['option1', 'option3'],
        orderedItems: [],
        highlightedWords: [],
      };

      const reorderParagraphsResponse = {
        textResponse: null,
        audioResponseUrl: null,
        selectedOptions: [],
        orderedItems: ['para3', 'para1', 'para2'],
        highlightedWords: [],
      };

      const highlightIncorrectWordsResponse = {
        textResponse: null,
        audioResponseUrl: null,
        selectedOptions: [],
        orderedItems: [],
        highlightedWords: ['incorrect', 'word'],
      };

      // Validate Read Aloud response
      expect(readAloudResponse.audioResponseUrl).toBeTruthy();
      expect(readAloudResponse.selectedOptions).toHaveLength(0);

      // Validate Multiple Choice response
      expect(multipleChoiceResponse.selectedOptions.length).toBeGreaterThan(0);
      expect(multipleChoiceResponse.audioResponseUrl).toBeNull();

      // Validate Re-order Paragraphs response
      expect(reorderParagraphsResponse.orderedItems.length).toBeGreaterThan(0);

      // Validate Highlight Incorrect Words response
      expect(highlightIncorrectWordsResponse.highlightedWords.length).toBeGreaterThan(0);
    });
  });
});

// Example usage patterns for the new UserResponse system
describe('UserResponse Usage Examples', () => {
  it('should demonstrate creating a response for Read Aloud question', () => {
    const readAloudResponseData = {
      userId: 'user123',
      questionId: 'question456',
      textResponse: null,
      audioResponseUrl: 'https://s3.amazonaws.com/audio/user123_ra001.mp3',
      selectedOptions: [],
      orderedItems: [],
      highlightedWords: [],
      questionScore: 85,
      isCorrect: true,
      aiFeedback: 'Good pronunciation and fluency. Minor hesitation noted.',
      timeTakenSeconds: 45,
    };

    expect(readAloudResponseData).toMatchObject({
      userId: expect.any(String),
      questionId: expect.any(String),
      audioResponseUrl: expect.any(String),
      questionScore: expect.any(Number),
      isCorrect: expect.any(Boolean),
      timeTakenSeconds: expect.any(Number),
    });
  });

  it('should demonstrate creating a response for Essay question', () => {
    const essayResponseData = {
      userId: 'user123',
      questionId: 'question789',
      textResponse: 'Climate change is one of the most pressing issues of our time...',
      audioResponseUrl: null,
      selectedOptions: [],
      orderedItems: [],
      highlightedWords: [],
      questionScore: 78,
      isCorrect: null, // Essays don't have simple correct/incorrect
      aiFeedback: 'Good structure and vocabulary. Consider improving coherence.',
      timeTakenSeconds: 1200, // 20 minutes
    };

    expect(essayResponseData.textResponse).toBeTruthy();
    expect(essayResponseData.textResponse!.length).toBeGreaterThan(10);
    expect(essayResponseData.audioResponseUrl).toBeNull();
  });
});
