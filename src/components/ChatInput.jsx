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
  isUploading,
  onModelChange,
  isModelLoading
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
    if (onModelChange) {
      onModelChange(model);
    } else {
      setSelectedModel(model);
    }
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
              <span className="toggle-model-name">
                {selectedModel && (typeof selectedModel === 'object' ? selectedModel.id : selectedModel)}
              </span>
              {dropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                {models.map(model => {
                  // Handle both cases: model as object or model as string
                  const modelId = typeof model === 'object' && model.id ? model.id : model;
                  const displayName = typeof model === 'object' && model.name ? model.name : modelId;
                  const selectedModelId = typeof selectedModel === 'object' && selectedModel.id ?
                    selectedModel.id : selectedModel;
                  
                  return (
                    <button
                      key={modelId}
                      className={`dropdown-item ${modelId === selectedModelId ? 'active' : ''}`}
                      onClick={() => selectModel(modelId)}
                    >
                      <div className="model-name">{displayName}</div>
                      {typeof model === 'object' && model.size_parameters && (
                        <div className="model-size">
                          {(model.size_parameters / 1000000000).toFixed(1)}B params
                          {model.quantization_level && ` (${model.quantization_level})`}
                        </div>
                      )}
                    </button>
                  );
                })}
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
