/**
 * Message utility functions.
 * Provides helper functions for handling message content.
 *
 * For an overview of all project files, see `src/FILE_MAP.md`.
 */

export const getSafeMessageContent = (content) => {
  if (typeof content === 'string') {
    return <span dangerouslySetInnerHTML={{ __html: content }} />;
  } else if (typeof content === 'object') {
    try {
      const stringContent = JSON.stringify(content, null, 2); // Format for readability
      return <pre>{stringContent}</pre>;
    } catch (error) {
      console.error("Error stringifying message content:", error);
      return <span>Error displaying message content.</span>;
    }
  } else if (content) { // Check if content is not null or undefined but not a string or object
    return <span>{String(content)}</span>;
  } else {
    return null; // Or a placeholder like <span>No content</span>
  }
};
