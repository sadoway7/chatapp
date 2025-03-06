import React from 'react';
import { FiCopy, FiRefreshCw, FiSquare } from 'react-icons/fi';
import { getSafeMessageContent } from '../utils/message.jsx';

const ChatMessages = ({ messages, chatContainerRef, isTyping, handleRetry, handleStopGeneration }) => {
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
  
  // Add event listeners for code block copy buttons
  React.useEffect(() => {
    const handleCodeBlockCopy = (event) => {
      // Check if the click was on a code block's ::after pseudo-element (copy button)
      // We can approximate this by checking if the click is in the top-right corner of a pre element
      if (event.target.tagName === 'PRE') {
        const rect = event.target.getBoundingClientRect();
        const isTopRightCorner =
          event.clientX > rect.right - 50 &&
          event.clientX < rect.right &&
          event.clientY > rect.top &&
          event.clientY < rect.top + 30;
        
        if (isTopRightCorner) {
          // Find the code element inside the pre
          const codeElement = event.target.querySelector('code');
          if (codeElement) {
            // Copy the text content
            navigator.clipboard.writeText(codeElement.textContent)
              .then(() => {
                setShowCopyMessage(true);
                console.log('Code copied to clipboard');
              })
              .catch(err => {
                console.error('Failed to copy code:', err);
              });
          }
        }
      }
    };
    
    // Add the event listener to the chat container
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('click', handleCodeBlockCopy);
    }
    
    // Clean up
    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('click', handleCodeBlockCopy);
      }
    };
  }, [chatContainerRef]);

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
  
  // Function removed: handleCopyMarkdown

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
          <div
            key={index}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'} ${message.hasAttachment ? 'has-attachment' : ''}`}
            data-attachment-name={message.attachmentName || ''}
          >
            <div className={`message-content ${!message.content.includes('\n') ? 'single-line' : ''} ${message.isStreaming ? 'streaming' : ''}`}>
              {getSafeMessageContent(message.content, message.role === 'assistant')}
            </div>
            {message.role === 'assistant' && typeof message.content === 'string' && !message.isStreaming && (
              <div className="message-actions-container">
                <div className="message-actions">
                  <button
                    className="copy-button"
                    onClick={() => handleCopyMessage(message.content)}
                    aria-label="Copy message"
                    title="Copy text"
                  >
                    <FiCopy />
                  </button>
                  <button
                    className="retry-button"
                    onClick={() => handleRetry(index)}
                    aria-label="Retry message"
                    title="Regenerate response"
                  >
                    <FiRefreshCw />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatMessages;