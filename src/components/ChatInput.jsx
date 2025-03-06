import React, { useRef, useEffect, useState } from 'react';
import { FiSend, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import FileUpload from './FileUpload';

const ChatInput = ({
  input,
  setInput,
  handleSend,
  selectedModel,
  setSelectedModel,
  models = [],
  uploadedFile,
  onFileUpload,
  onFileRemove,
  onFileError,
  fileError,
  isUploading
}) => {
  const textareaRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e) => {
    // Send message on Enter (without Shift key)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid new line
      handleSend();
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const selectModel = (model) => {
    setSelectedModel(model);
    setDropdownOpen(false);
  };

  return (
    <div className="chat-input-container">
      {fileError && (
        <div className="file-error-message">
          {fileError}
        </div>
      )}
      <div className="input-row">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={uploadedFile ? `Message with attached file: ${uploadedFile.name}` : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="1"
        />
      </div>
      <div className="input-footer">
        <FileUpload
          onFileUpload={onFileUpload}
          onFileRemove={onFileRemove}
          onError={onFileError}
          uploadedFile={uploadedFile}
          isUploading={isUploading}
        />
        <div className="spacer"></div>
        {models.length > 0 && (
          <div className="custom-dropdown" ref={dropdownRef}>
            <button
              className="dropdown-toggle"
              onClick={toggleDropdown}
              title="Select AI Model"
            >
              {selectedModel} {dropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                {models.map(model => (
                  <button
                    key={model}
                    className={`dropdown-item ${model === selectedModel ? 'active' : ''}`}
                    onClick={() => selectModel(model)}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button className="send-button" onClick={handleSend}>
          <FiSend />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
