// Utility shuffle function
export function shuffleArray(array: any[]) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

export const formatScoringText = (text: string) => {
  if (text === 'content') {
    return 'Content';
  }
  if (text === 'oralFluency') {
    return 'Oral Fluency';
  }
  if (text === 'pronunciation') {
    return 'Pronunciation';
  }
  if (text === 'vocabulary') {
    return 'Vocabulary';
  }
  if (text === 'form') {
    return 'Form';
  }
  if (text === 'grammar') {
    return 'Grammar';
  }
  if (text === 'developmentStructureCoherence') {
    return 'Development Structure Coherence';
  }
  if (text === 'generalLinguisticRange') {
    return 'General Linguistic Range';
  }
  if (text === 'spelling') {
    return 'Spelling';
  }
  if (text === 'vocabularyRange') {
    return 'Vocabulary Range';
  }
  if (text === 'reading') {
    return 'Reading';
  }
  if (text === 'listening') {
    return 'Listening';
  }
};