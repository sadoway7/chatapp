import React from 'react';
import { FiCopy, FiRefreshCw } from 'react-icons/fi';
import { getSafeMessageContent } from '../utils/message.jsx';

const ChatMessages = ({ messages, chatContainerRef, isTyping, handleRetry }) => {
  const [showCopyMessage, setShowCopyMessage] = React.useState(false);

  React.useEffect(() => {
    let timeoutId;
    if (showCopyMessage) {
      timeoutId = setTimeout(() => {
        setShowCopyMessage(false);
      }, 1500);
    }
    return () => clearTimeout(timeoutId);
  }, [showCopyMessage]);

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setShowCopyMessage(true);
        console.log('Text copied to clipboard:', content);
      })
      .catch(err => {
        console.error('Failed to copy text:', err);
      });
  };

  return (
    <div className="chat-messages" ref={chatContainerRef}>
      {showCopyMessage && <div className="copy-message">Copied!</div>} {/* Add this line */}
      {messages.map((message, index) => (
        <div key={index} className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}>
          <div className="message-content">{getSafeMessageContent(message.content)}</div>
          {message.role === 'assistant' && typeof message.content === 'string' && (
            <div className="message-actions-container">
              <div className="message-actions">
                <button className="copy-button" onClick={() => handleCopyMessage(message.content)}>
                  <FiCopy />
                </button>
                <button className="retry-button" onClick={() => handleRetry(index)}>
                  <FiRefreshCw />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {isTyping && <div className="typing-indicator">Thinking...</div>}
    </div>
  );
};

export default ChatMessages;
