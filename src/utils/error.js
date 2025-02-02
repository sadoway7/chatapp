export const handleApiError = (error, source) => {
  console.error(`API Error in ${source}:`, error);
  // Consider adding more robust error handling here, such as displaying a user-friendly error message.
};
