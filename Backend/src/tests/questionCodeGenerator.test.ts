import { PteQuestionTypeName } from '@prisma/client';
import {
  getQuestionTypeAbbreviation,
  isValidQuestionCodeFormat,
  extractAbbreviationFromCode,
  extractNumberFromCode,
} from '../utils/questionCodeGenerator';

describe('Question Code Generator', () => {
  describe('getQuestionTypeAbbreviation', () => {
    it('should return correct abbreviations for speaking questions', () => {
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.READ_ALOUD)).toBe('RA');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.REPEAT_SENTENCE)).toBe('RS');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.DESCRIBE_IMAGE)).toBe('DI');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.RE_TELL_LECTURE)).toBe('RTL');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.ANSWER_SHORT_QUESTION)).toBe('ASQ');
    });

    it('should return correct abbreviations for writing questions', () => {
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.SUMMARIZE_WRITTEN_TEXT)).toBe('SWT');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.WRITE_ESSAY)).toBe('WE');
    });

    it('should return correct abbreviations for reading questions', () => {
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.READING_WRITING_FILL_IN_THE_BLANKS)).toBe('RWFIB');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_READING)).toBe('MCMAR');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.RE_ORDER_PARAGRAPHS)).toBe('ROP');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.READING_FILL_IN_THE_BLANKS)).toBe('RFIB');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_READING)).toBe('MCSAR');
    });

    it('should return correct abbreviations for listening questions', () => {
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.SUMMARIZE_SPOKEN_TEXT)).toBe('SST');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.MULTIPLE_CHOICE_MULTIPLE_ANSWERS_LISTENING)).toBe('MCMAL');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.FILL_IN_THE_BLANKS_LISTENING)).toBe('FIBL');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.HIGHLIGHT_CORRECT_SUMMARY)).toBe('HCS');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.MULTIPLE_CHOICE_SINGLE_ANSWER_LISTENING)).toBe('MCSAL');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.SELECT_MISSING_WORD)).toBe('SMW');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.HIGHLIGHT_INCORRECT_WORDS)).toBe('HIW');
      expect(getQuestionTypeAbbreviation(PteQuestionTypeName.WRITE_FROM_DICTATION)).toBe('WFD');
    });
  });

  describe('isValidQuestionCodeFormat', () => {
    it('should validate correct question code formats', () => {
      expect(isValidQuestionCodeFormat('RA_001')).toBe(true);
      expect(isValidQuestionCodeFormat('RS_123')).toBe(true);
      expect(isValidQuestionCodeFormat('RWFIB_999')).toBe(true);
      expect(isValidQuestionCodeFormat('MCMAL_001')).toBe(true);
    });

    it('should reject invalid question code formats', () => {
      expect(isValidQuestionCodeFormat('RA_1')).toBe(false); // Not 3 digits
      expect(isValidQuestionCodeFormat('RA_1234')).toBe(false); // More than 3 digits
      expect(isValidQuestionCodeFormat('ra_001')).toBe(false); // Lowercase
      expect(isValidQuestionCodeFormat('RA-001')).toBe(false); // Wrong separator
      expect(isValidQuestionCodeFormat('RA001')).toBe(false); // No separator
      expect(isValidQuestionCodeFormat('RA_ABC')).toBe(false); // Non-numeric
      expect(isValidQuestionCodeFormat('')).toBe(false); // Empty string
    });
  });

  describe('extractAbbreviationFromCode', () => {
    it('should extract abbreviation from valid question codes', () => {
      expect(extractAbbreviationFromCode('RA_001')).toBe('RA');
      expect(extractAbbreviationFromCode('RWFIB_123')).toBe('RWFIB');
      expect(extractAbbreviationFromCode('MCMAL_999')).toBe('MCMAL');
    });

    it('should return empty string for invalid codes', () => {
      expect(extractAbbreviationFromCode('RA_1')).toBe('');
      expect(extractAbbreviationFromCode('invalid')).toBe('');
      expect(extractAbbreviationFromCode('')).toBe('');
    });
  });

  describe('extractNumberFromCode', () => {
    it('should extract number from valid question codes', () => {
      expect(extractNumberFromCode('RA_001')).toBe(1);
      expect(extractNumberFromCode('RS_123')).toBe(123);
      expect(extractNumberFromCode('RWFIB_999')).toBe(999);
    });

    it('should return 0 for invalid codes', () => {
      expect(extractNumberFromCode('RA_ABC')).toBe(0);
      expect(extractNumberFromCode('invalid')).toBe(0);
      expect(extractNumberFromCode('')).toBe(0);
    });
  });
});

// Example usage and expected behavior
describe('Question Code Generation Examples', () => {
  it('should demonstrate expected question code patterns', () => {
    const examples = [
      { type: PteQuestionTypeName.READ_ALOUD, expected: 'RA' },
      { type: PteQuestionTypeName.DESCRIBE_IMAGE, expected: 'DI' },
      { type: PteQuestionTypeName.WRITE_ESSAY, expected: 'WE' },
      { type: PteQuestionTypeName.RE_ORDER_PARAGRAPHS, expected: 'ROP' },
      { type: PteQuestionTypeName.WRITE_FROM_DICTATION, expected: 'WFD' },
    ];

    examples.forEach(({ type, expected }) => {
      const abbreviation = getQuestionTypeAbbreviation(type);
      expect(abbreviation).toBe(expected);
      
      // Test that a generated code would be valid
      const sampleCode = `${abbreviation}_001`;
      expect(isValidQuestionCodeFormat(sampleCode)).toBe(true);
      expect(extractAbbreviationFromCode(sampleCode)).toBe(expected);
      expect(extractNumberFromCode(sampleCode)).toBe(1);
    });
  });
});
