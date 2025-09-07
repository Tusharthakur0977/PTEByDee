# Automatic Question Code Generation

## Overview

The PTE By DEE platform now supports automatic question code generation when creating new questions. This feature eliminates the need for manual question code entry and ensures consistent, unique question codes across all question types.

## Features

### 1. Automatic Code Generation
- **Format**: `{ABBREVIATION}_{NUMBER}`
- **Example**: `RA_001`, `RS_002`, `DI_003`
- **Numbering**: Sequential numbering per question type with 3-digit padding

### 2. Question Type Abbreviations

| Question Type | Abbreviation | Section |
|---------------|--------------|---------|
| Read Aloud | RA | Speaking |
| Repeat Sentence | RS | Speaking |
| Describe Image | DI | Speaking |
| Re-tell Lecture | RTL | Speaking |
| Answer Short Question | ASQ | Speaking |
| Summarize Written Text | SWT | Writing |
| Write Essay | WE | Writing |
| Reading & Writing Fill in the Blanks | RWFIB | Reading |
| Multiple Choice Multiple Answers (Reading) | MCMAR | Reading |
| Re-order Paragraphs | ROP | Reading |
| Reading Fill in the Blanks | RFIB | Reading |
| Multiple Choice Single Answer (Reading) | MCSAR | Reading |
| Summarize Spoken Text | SST | Listening |
| Multiple Choice Multiple Answers (Listening) | MCMAL | Listening |
| Fill in the Blanks (Listening) | FIBL | Listening |
| Highlight Correct Summary | HCS | Listening |
| Multiple Choice Single Answer (Listening) | MCSAL | Listening |
| Select Missing Word | SMW | Listening |
| Highlight Incorrect Words | HIW | Listening |
| Write from Dictation | WFD | Listening |

### 3. User Interface Features
- **Auto-generate Toggle**: Checkbox to enable/disable automatic generation
- **Live Preview**: Shows the next question code when a question type is selected
- **Manual Override**: Option to manually enter a custom question code
- **Validation**: Ensures unique question codes across the system

## How It Works

### Backend Implementation

1. **Question Code Generation**:
   ```typescript
   // Generate next code for a question type
   const nextCode = await generateQuestionCode(questionTypeId);
   // Result: "RA_001", "RA_002", etc.
   ```

2. **API Endpoints**:
   - `GET /api/admin/questions/next-code/:questionTypeId` - Preview next code
   - `POST /api/admin/questions` - Create question (with optional auto-generation)

3. **Database Logic**:
   - Finds highest existing number for the question type
   - Increments by 1 for the next question
   - Handles gaps in numbering (e.g., if RA_002 is deleted, next will be RA_004)

### Frontend Implementation

1. **Question Form**:
   - Auto-generate checkbox (enabled by default for new questions)
   - Live preview of next question code
   - Manual input field when auto-generation is disabled

2. **User Experience**:
   - Select question type → See preview code immediately
   - Toggle auto-generation on/off as needed
   - Submit form with or without manual question code

## Usage Examples

### Creating a New Read Aloud Question
1. Open question creation form
2. Select "Read Aloud" as question type
3. Preview shows "RA_001" (or next available number)
4. Fill in question content
5. Submit - question is created with code "RA_001"

### Manual Question Code
1. Uncheck "Auto-generate" option
2. Enter custom code like "RA_CUSTOM_001"
3. System validates uniqueness
4. Submit with custom code

### Existing Questions
- Editing existing questions preserves their original codes
- Auto-generation is disabled by default for existing questions
- Can still manually change codes if needed

## Benefits

1. **Consistency**: All question codes follow the same format
2. **Uniqueness**: Automatic prevention of duplicate codes
3. **Efficiency**: No need to manually track and assign codes
4. **Scalability**: System handles large numbers of questions automatically
5. **Flexibility**: Option to use custom codes when needed

## Technical Details

### Code Generation Logic
```typescript
// Example for Read Aloud questions
// Existing codes: RA_001, RA_002, RA_005
// Next generated code: RA_006

const abbreviation = getQuestionTypeAbbreviation(questionType.name); // "RA"
const existingNumbers = [1, 2, 5]; // Extracted from existing codes
const nextNumber = Math.max(...existingNumbers) + 1; // 6
const formattedCode = `${abbreviation}_${nextNumber.toString().padStart(3, '0')}`; // "RA_006"
```

### Error Handling
- Invalid question type IDs return appropriate error messages
- Database constraints prevent duplicate question codes
- Frontend validation ensures proper format before submission

### Performance Considerations
- Question code generation is optimized with database indexing
- Preview API calls are debounced to prevent excessive requests
- Caching can be implemented for frequently accessed question types

## Migration Notes

- Existing questions retain their current codes
- New questions default to auto-generation
- No breaking changes to existing functionality
- Backward compatible with manual question code entry
