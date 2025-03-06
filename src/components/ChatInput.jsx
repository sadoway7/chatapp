import React, { useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';

const ChatInput = ({ input, setInput, handleSend }) => {
  const textareaRef = useRef(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Calculate new height (capped at 4 lines)
      const lineHeight = 24; // Approximate line height in pixels
      const maxHeight = lineHeight * 4; // Max height for 4 lines
      const scrollHeight = textareaRef.current.scrollHeight;
      
      // Set the height to either the scrollHeight or maxHeight, whichever is smaller
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    // Send message on Enter (without Shift key)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line
      handleSend();
    }
  };

  return (
    <div className="chat-input-container">
      <div className="input-row">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="1"
        />
        <button className="send-button" onClick={handleSend}>
          <FiSend />
        </button>
      </div>
      {/* Options row can be added here later */}
    </div>
  );
};

export default ChatInput;
