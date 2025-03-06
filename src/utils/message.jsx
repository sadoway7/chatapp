import React from 'react';
import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,  // Convert \n to <br>
  gfm: true,     // GitHub Flavored Markdown
  headerIds: false,
  mangle: false,
  sanitize: false
});

export const getSafeMessageContent = (content, isAssistant = false) => { // Ensure getSafeMessageContent is exported
  if (typeof content === 'string') {
    // Trim whitespace from the beginning and end of the content
    const trimmedContent = content.trim();
    
    // Remove extra blank lines (more than one consecutive newline)
    const normalizedContent = trimmedContent.replace(/\n{3,}/g, '\n\n');
    
    // Only render markdown for assistant messages
    if (isAssistant) {
      // Render markdown and return as HTML
      return <div dangerouslySetInnerHTML={{ __html: marked(normalizedContent) }} className="markdown-content" />;
    } else {
      // For user messages, just return the text without markdown
      return <div className="user-content">{normalizedContent}</div>;
    }
  } else if (typeof content === 'object') {
    try {
      const stringContent = JSON.stringify(content, null, 2);
      // Render as code block only for assistant messages
      if (isAssistant) {
        return <div dangerouslySetInnerHTML={{ __html: marked('```json\n' + stringContent + '\n```') }} className="markdown-content" />;
      } else {
        return <div className="user-content"><pre>{stringContent}</pre></div>;
      }
    } catch (error) {
      console.error("Error stringifying message content:", error);
      return <span>Error displaying message content.</span>;
    }
  } else if (content) {
    return <span>{String(content).trim()}</span>;
  } else {
    return null;
  }
};
