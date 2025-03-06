export const handleApiError = (error, source) => {
  console.error(`API Error in ${source}:`, error);

  // Extract status code and response text if available
  let statusCode = error.status || (error.response && error.response.status);
  let errorMessage = error.message || 'Unknown error occurred';

  // Handle specific error cases
  if (statusCode === 401) {
    errorMessage = 'Authentication failed. Please check your API key in settings.';
  } else if (statusCode === 403) {
    errorMessage = 'Access denied. Please verify your API key has the correct permissions.';
  } else if (statusCode === 404) {
    errorMessage = 'The requested resource was not found. Please check the API URL in settings.';
  } else if (statusCode >= 500) {
    errorMessage = 'Server error occurred. Please try again later.';
  }

  // If the error message contains a response text, use that instead
  if (error.message && error.message.includes('response text')) {
    try {
      const responseText = error.message.split('response text:')[1].trim();
      const parsedResponse = JSON.parse(responseText);
      if (parsedResponse.error) {
        errorMessage = parsedResponse.error;
      }
    } catch (e) {
      // If we can't parse the response text, stick with the original error message
      console.warn('Could not parse error response:', e);
    }
  }

  return {
    statusCode,
    message: errorMessage,
    originalError: error
  };
};
