import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import ChatMessages from './components/ChatMessages';
import SettingsModal from './components/SettingsModal';
import { fetchModels, sendChatMessage, uploadFile } from './api/openwebui';
import config from './config.json';
import { handleCommand } from './commands';
import { handleApiError } from './utils/error';
import './index.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [openWebUIUrl, setOpenWebUIUrl] = useState(localStorage.getItem('openWebUIUrl') || config.openWebUIUrl);
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || config.apiKey);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('selectedModel') || config.selectedModel);
  const [fetchError, setFetchError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const storedOpenWebUIUrl = localStorage.getItem('openWebUIUrl');
    const storedApiKey = localStorage.getItem('apiKey');
    const storedSelectedModel = localStorage.getItem('selectedModel');

    if (storedOpenWebUIUrl) {
      setOpenWebUIUrl(storedOpenWebUIUrl);
    } else {
      localStorage.setItem('openWebUIUrl', config.openWebUIUrl);
    }

    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      localStorage.setItem('apiKey', config.apiKey);
    }

    if (storedSelectedModel) {
      setSelectedModel(storedSelectedModel);
    } else {
      localStorage.setItem('selectedModel', config.selectedModel);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      if (openWebUIUrl && apiKey && selectedModel) {
        try {
          const fetchedModels = await fetchModels(openWebUIUrl, apiKey);
          setModels(fetchedModels.map(model => model.id));
        } catch (error) {
          handleApiError(error, 'Initialization');
          setFetchError(error.message);
        }
      }
    };

    initialize();
  }, [openWebUIUrl, apiKey, selectedModel]);

  const handleFileUpload = async (file) => {
    console.log('App: handleFileUpload called with file:', file.name, file.type, file.size);
    setUploadedFile(file);
    setIsUploading(true);
    setFileError(null); // Clear any previous errors
    
    try {
      console.log('App: Uploading file to API...');
      const response = await uploadFile(openWebUIUrl, apiKey, file);
      console.log('App: File uploaded successfully:', response);
      setFileId(response.id);
    } catch (error) {
      console.error('App: Error uploading file:', error);
      setFileError('Failed to upload file. Please try again.');
      setUploadedFile(null);
    } finally {
      console.log('App: Upload process completed');
      setIsUploading(false);
    }
  };

  const handleFileRemove = () => {
    console.log('App: Removing file');
    setUploadedFile(null);
    setFileId(null);
    setFileError(null);
  };

  const handleFileError = (errorMessage) => {
    console.log('App: File error:', errorMessage);
    setFileError(errorMessage);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (input.startsWith('>')) {
      const command = input.substring(1).trim();
      handleCommand(command, setInput, setShowSettings);
      return;
    }

    const userMessage = {
      role: 'user',
      content: input,
      isOriginalUserMessage: true, // Add metadata to identify original user messages
      hasAttachment: !!fileId, // Add flag to indicate if message has a file attachment
      attachmentName: uploadedFile ? uploadedFile.name : null // Add the file name for display
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Clear the file immediately after sending
    const tempFileId = fileId; // Store fileId temporarily for the API call
    setUploadedFile(null);
    setFileId(null);

    try {
      const response = await sendChatMessage(
        openWebUIUrl,
        apiKey,
        selectedModel,
        [...messages, userMessage],
        tempFileId // Pass the temporary file ID if available
      );
      if (!response || !response.choices || !response.choices.length || !response.choices[0].message) {
        throw new Error('Invalid response format from API.');
      }
      const assistantMessage = {
        role: 'assistant',
        content: response.choices[0].message.content,
        isResponseToRetry: false
      };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      handleApiError(error, 'handleSendMessage');
      const errorAssistantMessage = {
        role: 'assistant',
        content: 'Failed to get response from API, Check Settings',
        isResponseToRetry: false
      };
      setMessages(prevMessages => [...prevMessages, errorAssistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    if (name === 'openWebUIUrl') {
      setOpenWebUIUrl(value);
    } else if (name === 'apiKey') {
      setApiKey(value);
    } else if (name === 'selectedModel') {
      setSelectedModel(value);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    localStorage.setItem('openWebUIUrl', openWebUIUrl);
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('selectedModel', selectedModel);
    setShowSettings(false);

    try {
      const fetchedModels = await fetchModels(openWebUIUrl, apiKey);
      setModels(fetchedModels.map(model => model.id));
      setFetchError(null);
    } catch (error) {
      handleApiError(error, 'handleSaveSettings');
      setFetchError(error.message);
    }
  };

  const handleLoadDefaultSettings = () => {
    setOpenWebUIUrl(config.openWebUIUrl);
    setApiKey(config.apiKey);
    setSelectedModel(config.selectedModel);
  };

  const handleClearChat = () => {
    setMessages([]);
  };
  const handleRetrySend = async (retryMessage, originalUserMessageIndex) => {
    setIsTyping(true);
    try {
      // Get message history up to the retry point
      const messageHistory = messages.slice(0, -1); // Remove last assistant message
      
      // Add our retry prompt with metadata
      const messagesWithRetry = [...messageHistory, {
        role: 'user',
        content: retryMessage,
        isRetryPrompt: true,
        originalUserMessageIndex: originalUserMessageIndex
      }];
      
      // Log for debugging
      console.log('Sending retry with original message index:', originalUserMessageIndex);
      
      const response = await sendChatMessage(openWebUIUrl, apiKey, selectedModel, messagesWithRetry);
      if (!response || !response.choices || !response.choices.length || !response.choices[0].message) {
        throw new Error('Invalid response format from API.');
      }
      const assistantMessage = {
        role: 'assistant',
        content: response.choices[0].message.content,
        isResponseToRetry: messagesWithRetry.some(msg => msg.isRetryPrompt)
      };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      handleApiError(error, 'handleSendMessage');
      const errorAssistantMessage = {
        role: 'assistant',
        content: 'Failed to get response from API, Check Settings',
        isResponseToRetry: true
      };
      setMessages(prevMessages => [...prevMessages, errorAssistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = (index) => {
    console.log('Retry clicked for message at index:', index);
    
    // Find the original user message this assistant is responding to
    let originalUserMessageIndex = -1;
    let originalUserMessage = '';
    
    // Check if the previous message is a retry prompt
    if (index > 0 && messages[index-1].role === 'user' && messages[index-1].isRetryPrompt) {
      // If it's a retry prompt, use its originalUserMessageIndex
      originalUserMessageIndex = messages[index-1].originalUserMessageIndex;
      if (originalUserMessageIndex !== undefined && messages[originalUserMessageIndex]) {
        originalUserMessage = messages[originalUserMessageIndex].content;
        console.log('Found original message via retry prompt metadata:', originalUserMessageIndex);
      }
    }
    
    // If we couldn't find the original message via metadata, search for it
    if (originalUserMessageIndex === -1 || !originalUserMessage) {
      let userMessageIndex = index - 1;
      while (userMessageIndex >= 0) {
        if (messages[userMessageIndex].role === 'user' && messages[userMessageIndex].isOriginalUserMessage) {
          originalUserMessage = messages[userMessageIndex].content;
          originalUserMessageIndex = userMessageIndex;
          console.log('Found original message by searching:', originalUserMessageIndex);
          break;
        }
        userMessageIndex--;
      }
    }
    
    // If we still couldn't find an original user message, use the most recent user message
    if (originalUserMessageIndex === -1 || !originalUserMessage) {
      let userMessageIndex = index - 1;
      while (userMessageIndex >= 0) {
        if (messages[userMessageIndex].role === 'user') {
          originalUserMessage = messages[userMessageIndex].content;
          originalUserMessageIndex = userMessageIndex;
          console.log('Falling back to most recent user message:', originalUserMessageIndex);
          break;
        }
        userMessageIndex--;
      }
    }
    
    if (originalUserMessageIndex >= 0 && originalUserMessage) {
      console.log('Creating retry prompt for original message:', originalUserMessage);
      
      const retryMessage = `Acknowledge that your previous response wasn't satisfactory and provide a new, different response to the user's question. Take a different approach this time by:
  1. Using a different perspective or methodology
  2. Providing more specific examples or details
  3. Breaking down the explanation in a clearer way
  4. Being more direct and concise
  5. you may get this message again, you need to have a different response each time
  
  Important: Do not repeat content from your previous response. Focus on giving a fresh, alternative answer that might better address what the user is looking for.
  
  Original user message: ${originalUserMessage}`;
      
      handleRetrySend(retryMessage, originalUserMessageIndex);
    } else {
      console.error('Could not find original user message to retry');
    }
  };

  useEffect(() => {
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    
    const handleResize = () => {
      document.body.style.height = `${window.innerHeight}px`;
    };

    handleResize(); // Set initial height
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [messages]);

  return (
    <div className="container">
      <Header handleClearChat={handleClearChat} />
      {fetchError && <div className="error-message">{fetchError}</div>}
      <ChatMessages messages={messages} chatContainerRef={chatContainerRef} isTyping={isTyping} handleRetry={handleRetry} />
      <ChatInput
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        models={models}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        uploadedFile={uploadedFile}
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        onFileError={handleFileError}
        fileError={fileError}
        isUploading={isUploading}
      />
      {showSettings && (
        <div className="settings-modal">
          <SettingsModal
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            openWebUIUrl={openWebUIUrl}
            setOpenWebUIUrl={setOpenWebUIUrl}
            apiKey={apiKey}
            setApiKey={setApiKey}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            models={models}
            handleSaveSettings={handleSaveSettings}
            handleLoadDefaultSettings={handleLoadDefaultSettings}
          />
        </div>
      )}
    </div>
  );
}

export default App;
