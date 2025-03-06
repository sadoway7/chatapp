import React, { useRef, useState } from 'react';
import { FiPaperclip, FiX } from 'react-icons/fi';

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  // Document formats
  '.pdf', '.txt', '.doc', '.docx', '.csv', '.rtf', '.md',
  // Image formats
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'
];

const FileUpload = ({ onFileUpload, onFileRemove, uploadedFile, isUploading, onError }) => {
  const fileInputRef = useRef(null);
  
  const handleFileSelect = () => {
    console.log('File select button clicked');
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    console.log('File input changed', e.target.files);
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('File selected:', file.name, file.type, file.size);
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        console.log('File too large:', file.size);
        onError(`File size exceeds the 10MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
        return;
      }
      
      // Check file type (by extension)
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      console.log('File extension:', fileExtension);
      if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
        console.log('File type not supported:', fileExtension);
        onError(`File type not supported. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
        return;
      }
      
      console.log('File passed validation, uploading...');
      onFileUpload(file);
    }
  };

  // Function to get appropriate icon based on file type
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    // Return appropriate icon based on file type
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
      case 'md':
      case 'rtf':
        return '📃';
      case 'csv':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp':
      case 'svg':
        return '🖼️';
      default:
        return '📎';
    }
  };

  return (
    <div className="file-upload-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept={ALLOWED_FILE_TYPES.join(',')}
      />
      
      {!uploadedFile ? (
        <button 
          className="file-upload-button" 
          onClick={handleFileSelect}
          disabled={isUploading}
          title="Attach a file (max 10MB)"
        >
          <FiPaperclip />
        </button>
      ) : (
        <div className="uploaded-file">
          <span className="file-icon">{getFileIcon(uploadedFile.name)}</span>
          <span className="file-name" title={uploadedFile.name}>
            {uploadedFile.name.length > 15 
              ? uploadedFile.name.substring(0, 12) + '...' 
              : uploadedFile.name}
          </span>
          <button 
            className="remove-file-button" 
            onClick={onFileRemove}
            title="Remove file"
          >
            <FiX />
          </button>
        </div>
      )}
      
      {uploadedFile && uploadedFile.type.startsWith('image/') && (
        <div className="image-preview">
          <img 
            src={URL.createObjectURL(uploadedFile)} 
            alt="Preview" 
            className="preview-image"
          />
        </div>
      )}
      
      {isUploading && <span className="upload-spinner"></span>}
    </div>
  );
};

export default FileUpload;