export const normalizeTags = (tagsInput: unknown): string[] => {
  if (!Array.isArray(tagsInput)) return [];

  return tagsInput
    .map((tag) => {
      if (typeof tag !== 'string') return '';
      return tag.trim();
    })
    .filter((tag) => tag.length > 0);
};
