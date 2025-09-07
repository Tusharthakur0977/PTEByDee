# Standalone User Response System

## Overview

The PTE By DEE platform has been updated to focus on standalone question practice rather than full test attempts. The UserResponse model has been restructured to support individual question responses without requiring a test context.

## Changes Made

### 1. Database Schema Changes

#### UserResponse Model Updates
- **Removed**: `testAttemptId` and `testAttempt` relation
- **Added**: `userId` field with direct relation to User
- **Updated**: Indexes to support user-based queries
- **Maintained**: All response data fields (textResponse, audioResponseUrl, etc.)

#### User Model Updates
- **Added**: `userResponses` relation to UserResponse model

#### TestAttempt Model Updates
- **Removed**: `responses` relation (no longer needed for standalone practice)

### 2. API Changes

#### Updated Endpoints

**Submit Question Response**
- **Endpoint**: `POST /api/user/questions/submit-response`
- **Removed**: `testAttemptId` parameter
- **Behavior**: Now creates standalone UserResponse records linked directly to users

#### New Endpoints

**Get User Responses**
- **Endpoint**: `GET /api/user/responses`
- **Purpose**: Retrieve user's question responses with pagination and filtering
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `questionType` (filter by question type)
  - `isCorrect` (filter by correctness)
  - `sortBy` (default: 'createdAt')
  - `sortOrder` (default: 'desc')

**Get User Response Statistics**
- **Endpoint**: `GET /api/user/responses/stats`
- **Purpose**: Get user's overall response statistics
- **Returns**:
  - Total responses
  - Correct responses
  - Accuracy rate
  - Recent activity (last 7 days)
  - Responses by type count

### 3. Controller Updates

#### submitQuestionResponse.controller.ts
- Removed testAttemptId dependency
- Now creates UserResponse with userId directly
- Maintains practice session tracking
- Simplified logic for standalone question practice

#### deleteUser.controller.ts
- Updated to handle new UserResponse structure
- Removes user responses by userId instead of testAttemptId

#### getUserResponses.controller.ts (New)
- Provides comprehensive user response retrieval
- Supports filtering and pagination
- Includes question and question type details
- Calculates response statistics

## Usage Examples

### Submit a Question Response

```javascript
POST /api/user/questions/submit-response
{
  "questionId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "userResponse": {
    "textResponse": "Climate change is a global issue...",
    "selectedOptions": ["option1", "option2"],
    "orderedItems": ["para1", "para2", "para3"],
    "highlightedWords": ["incorrect", "word"]
  },
  "timeTakenSeconds": 120
}
```

### Get User Responses

```javascript
GET /api/user/responses?page=1&limit=10&questionType=READ_ALOUD&isCorrect=true

Response:
{
  "success": true,
  "data": {
    "responses": [
      {
        "id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "questionId": "64f8a1b2c3d4e5f6a7b8c9d1",
        "questionCode": "RA_001",
        "questionType": "READ_ALOUD",
        "sectionName": "Speaking",
        "textResponse": "User's response text...",
        "questionScore": 85,
        "isCorrect": true,
        "aiFeedback": "Good pronunciation and fluency...",
        "timeTakenSeconds": 45,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalResponses": 47,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10
    }
  }
}
```

### Get Response Statistics

```javascript
GET /api/user/responses/stats

Response:
{
  "success": true,
  "data": {
    "totalResponses": 47,
    "correctResponses": 32,
    "accuracyRate": 68.09,
    "recentActivity": 12,
    "responsesByType": 8
  }
}
```

## Benefits

### 1. Simplified Architecture
- No dependency on test attempts for individual practice
- Direct user-to-response relationship
- Cleaner data model for standalone practice

### 2. Better User Experience
- Users can practice individual questions without test context
- Immediate feedback and scoring
- Personal progress tracking per question type

### 3. Enhanced Analytics
- Better insights into user performance per question type
- Detailed response history
- Improved practice session tracking

### 4. Scalability
- More efficient queries for user responses
- Better indexing for user-based operations
- Reduced complexity in data relationships

## Migration Notes

### Database Migration Required
- The schema changes require a database migration
- Existing UserResponse records with testAttemptId will need to be handled
- Consider data migration strategy for existing test-based responses

### Frontend Updates Needed
- Remove testAttemptId from question submission forms
- Update response display components to use new API endpoints
- Implement new response statistics dashboard

### Backward Compatibility
- Test-related functionality is preserved
- Practice session tracking continues to work
- Existing practice response system remains intact

## Future Enhancements

1. **Response Analytics Dashboard**: Visual representation of user progress
2. **Question Recommendation**: AI-powered question suggestions based on performance
3. **Detailed Performance Metrics**: Per-skill scoring and improvement tracking
4. **Response Comparison**: Compare responses with model answers
5. **Progress Goals**: Set and track practice goals per question type
