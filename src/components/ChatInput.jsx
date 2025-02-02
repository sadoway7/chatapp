import React from 'react';
import { FiSend } from 'react-icons/fi';

const ChatInput = ({ input, setInput, handleSend }) => {
  return (
    <div className="chat-input-container">
      <input
        type="text"
        className="chat-input"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSend();
          }
        }}
      />
      <button className="send-button" onClick={handleSend}>
        <FiSend />
      </button>
    </div>
  );
};

export default ChatInput;
