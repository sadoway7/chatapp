import React, { useState, useEffect, useRef } from 'react';
import { FiSquare } from 'react-icons/fi';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import ChatMessages from './components/ChatMessages';
import SettingsModal from './components/SettingsModal';
import { fetchModels, sendChatMessage, sendChatMessageStreaming, uploadFile } from './api/openwebui';
import { handleCommand } from './commands';
import { handleApiError } from './utils/error';
import { loadConfig } from './utils/config';
import './index.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [openWebUIUrl, setOpenWebUIUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [fetchError, setFetchError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeStreamController, setActiveStreamController] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadingModel, setLoadingModel] = useState('');
  const chatContainerRef = useRef(null);

  // Load config.json at runtime using the loadConfig utility
  useEffect(() => {
    const initializeConfig = async () => {
      try {
        const loadedConfig = await loadConfig();
        console.log('Loaded config using loadConfig utility:', loadedConfig);
        setOpenWebUIUrl(loadedConfig.openWebUIUrl || '');
        setApiKey(loadedConfig.apiKey || '');
        setSelectedModel(loadedConfig.selectedModel || '');
      } catch (error) {
        console.error('Error loading config:', error);
        setFetchError('Failed to load configuration. Please check config.json.');
      }
    };

    initializeConfig();
  }, []);

  // This useEffect is no longer needed as we're handling this in the config loading useEffect

  useEffect(() => {
    const initialize = async () => {
      if (openWebUIUrl && apiKey) {
        try {
          const fetchedModels = await fetchModels(openWebUIUrl, apiKey);

          // Store models - handle both object and string formats
          if (Array.isArray(fetchedModels) && fetchedModels.length > 0) {
            setModels(fetchedModels);
            console.log('Fetched models:', fetchedModels);

            // If no model is selected yet, select the first one
            if (!selectedModel) {
              const firstModelId = typeof fetchedModels[0] === 'object' && fetchedModels[0].id
                ? fetchedModels[0].id
                : fetchedModels[0];
              setSelectedModel(firstModelId);
              console.log('Auto-selected first model:', firstModelId);
            }
          } else {
            // If we couldn't load any models, set some defaults
            const defaultModels = [
              "deepseekr138b.deepseek-r1",
              "phi4-mini:latest",
              "phi2:latest",
              "llama2:latest"
            ];
            setModels(defaultModels);
            console.log('Using default models:', defaultModels);
          }
        } catch (error) {
          // If we get an error, set some default models
          const defaultModels = [
            "deepseekr138b.deepseek-r1",
            "phi4-mini:latest",
            "phi2:latest",
            "llama2:latest"
          ];
          setModels(defaultModels);
          console.log('Error fetching models, using defaults:', defaultModels);

          const errorDetails = handleApiError(error, 'Initialization');
          const errorMessage = errorDetails.statusCode === 401 ?
            'Could not load models: Authentication failed. Please check your API key in settings.' :
            `Could not load models: ${errorDetails.message}`;
          setFetchError(errorMessage);
        }
      }
    };

    initialize();
  }, [openWebUIUrl, apiKey]);

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
      const errorDetails = handleApiError(error, 'handleFileUpload');
      const errorMessage = errorDetails.statusCode === 401 ?
        'Authentication failed. Please check your API key in settings.' :
        `Failed to upload file: ${errorDetails.message}`;
      setFileError(errorMessage);
      setUploadedFile(null);
      setFetchError(errorDetails.message);
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

    // Clear the file immediately after sending
    const tempFileId = fileId; // Store fileId temporarily for the API call
    setUploadedFile(null);
    setFileId(null);

    // Create an initial assistant message ID for tracking
    const assistantMessageId = Date.now();

    // Set typing indicator but don't add the message yet
    setIsTyping(true);

    try {
      // Use streaming API and store the controller
      const controller = await sendChatMessageStreaming(
        openWebUIUrl,
        apiKey,
        selectedModel,
        [...messages, userMessage],
        tempFileId,
        // onChunk callback - add the message if it doesn't exist yet, or update it
        (chunk) => {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const assistantMessageIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);

            if (assistantMessageIndex !== -1) {
              // Message exists, update it
              updatedMessages[assistantMessageIndex] = {
                ...updatedMessages[assistantMessageIndex],
                content: updatedMessages[assistantMessageIndex].content + chunk
              };
            } else {
              // Message doesn't exist yet, add it
              updatedMessages.push({
                id: assistantMessageId,
                role: 'assistant',
                content: chunk.trim(),
                isResponseToRetry: false,
                isStreaming: true
              });
            }

            return updatedMessages;
          });
        },
        // onComplete callback - mark streaming as complete
        (fullContent) => {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const assistantMessageIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);
            if (assistantMessageIndex !== -1) {
              updatedMessages[assistantMessageIndex] = {
                ...updatedMessages[assistantMessageIndex],
                content: fullContent.trim(),
                isStreaming: false
              };
            }
            return updatedMessages;
          });
          setIsTyping(false);
          setActiveStreamController(null); // Clear the controller when streaming is complete
        }
      );

      // Store the controller so we can abort it if needed
      setActiveStreamController(controller);
    } catch (error) {
      const errorDetails = handleApiError(error, 'handleSendMessage');
      // Check if a message was created and update it, or create a new error message
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const assistantMessageIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);

        const errorContent = `Error: ${errorDetails.message}${errorDetails.statusCode ? ` (Status: ${errorDetails.statusCode})` : ''}`;

        if (assistantMessageIndex !== -1) {
          // Update existing message with error
          updatedMessages[assistantMessageIndex] = {
            ...updatedMessages[assistantMessageIndex],
            content: errorContent,
            isStreaming: false,
            isError: true
          };
        } else {
          // Create new error message
          updatedMessages.push({
            id: assistantMessageId,
            role: 'assistant',
            content: errorContent,
            isResponseToRetry: false,
            isStreaming: false,
            isError: true
          });
        }

        // Set fetch error state for potential UI display
        setFetchError(errorDetails.message);

        return updatedMessages;
      });
      setIsTyping(false);
      setActiveStreamController(null); // Clear the controller on error
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

  const handleModelChange = (modelId) => {
    // Set loading state
    setIsModelLoading(true);
    setLoadingModel(modelId);

    // Store the model ID in localStorage
    //localStorage.setItem('selectedModel', modelId); // REMOVED
    setSelectedModel(modelId);

    // Simulate loading time (3-5 seconds)
    setTimeout(() => {
      setIsModelLoading(false);
      setLoadingModel('');
    }, 3000 + Math.random() * 2000); // Random time between 3-5 seconds
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    //localStorage.setItem('openWebUIUrl', openWebUIUrl); // REMOVED
    //localStorage.setItem('apiKey', apiKey); // REMOVED
    //localStorage.setItem('selectedModel', selectedModel); // REMOVED
    setShowSettings(false);

    try {
      const fetchedModels = await fetchModels(openWebUIUrl, apiKey);
      // Store full model objects instead of just IDs
      setModels(fetchedModels);
      setFetchError(null);
    } catch (error) {
      const errorDetails = handleApiError(error, 'handleSaveSettings');
      const errorMessage = errorDetails.statusCode === 401 ?
        'Failed to save settings: Authentication failed. Please verify your API key.' :
        `Failed to save settings: ${errorDetails.message}`;
      setFetchError(errorMessage);
    }
  };

  const handleLoadDefaultSettings = () => {
    // Use the dynamically loaded config with fallbacks
    //setOpenWebUIUrl(config.openWebUIUrl || "https://open.sadoway.ca"); // REMOVED
    //setApiKey(config.apiKey || ""); // REMOVED
    //setSelectedModel(config.selectedModel || "phi4-mini:latest"); // REMOVED
    //console.log('Loaded default settings from config:', config); // REMOVED
      setShowSettings(false); // Just close the settings - no loading
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleStopGeneration = (messageId) => {
    console.log('Stopping generation for message:', messageId);

    // If there's an active stream controller, abort it
    if (activeStreamController) {
      activeStreamController.abort();
      setActiveStreamController(null);
    }

    // Update the message to remove streaming state
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];

      // Find the streaming message
      let messageIndex = -1;

      if (messageId) {
        // If messageId is provided, find that specific message
        messageIndex = updatedMessages.findIndex(msg => msg.id === messageId);
      } else {
        // Otherwise find any streaming message
        messageIndex = updatedMessages.findIndex(msg => msg.isStreaming);
      }

      if (messageIndex !== -1) {
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          isStreaming: false,
          content: updatedMessages[messageIndex].content + " [Generation stopped]"
        };
      } else {
        // If no streaming message found but we're in typing state,
        // add a new message indicating generation was stopped
        const lastUserMessageIndex = updatedMessages.findLastIndex(msg => msg.role === 'user');
        if (lastUserMessageIndex !== -1) {
          updatedMessages.push({
            id: Date.now(),
            role: 'assistant',
            content: "[Generation stopped before completion]",
            isStreaming: false
          });
        }
      }

      return updatedMessages;
    });

    setIsTyping(false);
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

      // Create an initial assistant message ID for tracking
      const assistantMessageId = Date.now();

      // Use streaming API for retry and store the controller
      const controller = await sendChatMessageStreaming(
        openWebUIUrl,
        apiKey,
        selectedModel,
        messagesWithRetry,
        null, // No file ID for retry
        // onChunk callback - add the message if it doesn't exist yet, or update it
        (chunk) => {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const assistantMessageIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);

            if (assistantMessageIndex !== -1) {
              // Message exists, update it
              updatedMessages[assistantMessageIndex] = {
                ...updatedMessages[assistantMessageIndex],
                content: updatedMessages[assistantMessageIndex].content + chunk
              };
            } else {
              // Message doesn't exist yet, add it
              updatedMessages.push({
                id: assistantMessageId,
                role: 'assistant',
                content: chunk.trim(),
                isResponseToRetry: true,
                isStreaming: true
              });
            }

            return updatedMessages;
          });
        },
        // onComplete callback - mark streaming as complete
        (fullContent) => {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const assistantMessageIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);
            if (assistantMessageIndex !== -1) {
              updatedMessages[assistantMessageIndex] = {
                ...updatedMessages[assistantMessageIndex],
                content: fullContent.trim(),
                isStreaming: false
              };
            }
            return updatedMessages;
          });
          setIsTyping(false);
          setActiveStreamController(null); // Clear the controller when streaming is complete
        }
      );

      // Store the controller so we can abort it if needed
      setActiveStreamController(controller);
    } catch (error) {
      const errorDetails = handleApiError(error, 'handleRetrySend');
      // Check if a message was created and update it, or create a new error message
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const assistantMessageIndex = updatedMessages.findIndex(msg => msg.id === assistantMessageId);

        const errorContent = `Error: ${errorDetails.message}${errorDetails.statusCode ? ` (Status: ${errorDetails.statusCode})` : ''}`;

        if (assistantMessageIndex !== -1) {
          // Update existing message with error
          updatedMessages[assistantMessageIndex] = {
            ...updatedMessages[assistantMessageIndex],
            content: errorContent,
            isStreaming: false,
            isError: true
          };
        } else {
          // Create new error message
          updatedMessages.push({
            id: assistantMessageId,
            role: 'assistant',
            content: errorContent,
            isResponseToRetry: true,
            isStreaming: false,
            isError: true
          });
        }

        // Set fetch error state for potential UI display
        setFetchError(errorDetails.message);

        return updatedMessages;
      });
      setIsTyping(false);
      setActiveStreamController(null); // Clear the controller on error
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
      <Header
        handleClearChat={handleClearChat}
        isModelLoading={isModelLoading}
        loadingModel={loadingModel}
      />
      {fetchError && <div className="error-message">{fetchError}</div>}
      <ChatMessages
        messages={messages}
        chatContainerRef={chatContainerRef}
        isTyping={isTyping}
        handleRetry={handleRetry}
        handleStopGeneration={handleStopGeneration}
      />
      {isTyping && (
        <div className="stop-generation-floating">
          <button
            className="stop-button-floating"
            onClick={() => handleStopGeneration()}
            aria-label="Stop generation"
          >
            <FiSquare />
            <span>Stop</span>
          </button>
        </div>
      )}
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
        onModelChange={handleModelChange}
        isModelLoading={isModelLoading}
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
