import React from 'react';

export const getSafeMessageContent = (content) => { // Ensure getSafeMessageContent is exported
  if (typeof content === 'string') {
    return <span dangerouslySetInnerHTML={{ __html: content }} />;
  } else if (typeof content === 'object') {
    try {
      const stringContent = JSON.stringify(content, null, 2);
      return <pre>{stringContent}</pre>;
    } catch (error) {
      console.error("Error stringifying message content:", error);
      return <span>Error displaying message content.</span>;
    }
  } else if (content) {
    return <span>{String(content)}</span>;
  } else {
    return null;
  }
};
