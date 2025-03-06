import React from 'react';
import { FiCopy, FiRefreshCw } from 'react-icons/fi';
import { getSafeMessageContent } from '../utils/message.jsx';

const ChatMessages = ({ messages, chatContainerRef, isTyping, handleRetry }) => {
  const [showCopyMessage, setShowCopyMessage] = React.useState(false);
  // Add ref for the message container
  const copyMessageRef = React.useRef(null);

  React.useEffect(() => {
    let timeoutId;
    if (showCopyMessage) {
      // Ensure the message is visible by scrolling into view
      if (copyMessageRef.current) {
        copyMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
    <>
      {/* Move copy message outside the scrollable container */}
      {showCopyMessage && (
        <div className="copy-message" ref={copyMessageRef}>
          Copied!
        </div>
      )}
      
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}>
            <div className="message-content">{getSafeMessageContent(message.content)}</div>
            {message.role === 'assistant' && typeof message.content === 'string' && (
              <div className="message-actions-container">
                <div className="message-actions">
                  <button 
                    className="copy-button" 
                    onClick={() => handleCopyMessage(message.content)}
                    aria-label="Copy message"
                  >
                    <FiCopy />
                  </button>
                  <button 
                    className="retry-button" 
                    onClick={() => handleRetry(index)}
                    aria-label="Retry message"
                  >
                    <FiRefreshCw />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && <div className="typing-indicator"><span></span></div>}
      </div>
    </>
  );
};

export default ChatMessages;