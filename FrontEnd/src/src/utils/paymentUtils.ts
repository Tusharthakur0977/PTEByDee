/**
 * Utility functions for payment-related operations
 */

/**
 * Extract course ID from purchasedItem string
 * Format: "Course Name (courseId)"
 */
export const extractCourseIdFromPurchasedItem = (purchasedItem: string): string | null => {
  if (!purchasedItem) return null;
  
  // Match pattern: "Course Name (courseId)"
  const match = purchasedItem.match(/\(([a-f0-9]{24})\)$/);
  return match ? match[1] : null;
};

/**
 * Extract course name from purchasedItem string
 * Format: "Course Name (courseId)"
 */
export const extractCourseNameFromPurchasedItem = (purchasedItem: string): string => {
  if (!purchasedItem) return 'Course Purchase';
  
  // Remove the course ID part: "(courseId)"
  const courseName = purchasedItem.replace(/\s*\([a-f0-9]{24}\)$/, '');
  return courseName || 'Course Purchase';
};

/**
 * Format purchasedItem for display
 * Returns just the course name without the ID
 */
export const formatPurchasedItemForDisplay = (purchasedItem: string): string => {
  return extractCourseNameFromPurchasedItem(purchasedItem);
};

/**
 * Check if purchasedItem contains a valid course ID
 */
export const hasCourseId = (purchasedItem: string): boolean => {
  return extractCourseIdFromPurchasedItem(purchasedItem) !== null;
};
