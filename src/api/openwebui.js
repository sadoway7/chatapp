import { handleApiError } from '../utils/error';

export const uploadFile = async (openWebUIUrl, apiKey, file) => {
  console.log('API: uploadFile called with file:', file.name, file.type, file.size);
  console.log('API: Using URL:', `${openWebUIUrl}/api/v1/files/`);
  
  const headers = {};
  if (apiKey) {
    // Ensure the API key is properly formatted with 'Bearer ' prefix
    headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
    console.log('API: Using API key starting with:', apiKey.substring(0, 15) + '...');
  } else {
    console.warn('API: No API key provided for file upload');
  }

  try {
    console.log('API: Creating FormData and appending file');
    const formData = new FormData();
    formData.append('file', file);

    console.log('API: Sending fetch request');
    const response = await fetch(`${openWebUIUrl}/api/v1/files/`, {
      method: 'POST',
      headers,
      body: formData,
    });

    console.log('API: Received response with status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Error response body:', errorText);
      throw new Error(`Failed to upload file: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('API: Successfully parsed response:', data);
    return data;
  } catch (error) {
    console.error('API: Error in uploadFile:', error);
    handleApiError(error, 'uploadFile');
    throw error;
  }
};

export const fetchModels = async (openWebUIUrl, apiKey) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    // Ensure the API key is properly formatted with 'Bearer ' prefix
    headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
    console.log('API: Using API key starting with:', apiKey.substring(0, 15) + '...');
  } else {
    console.warn('API: No API key provided');
  }

  try {
    console.log('Fetching models from:', `${openWebUIUrl}/api/models`);
    const response = await fetch(`${openWebUIUrl}/api/models`, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}\n${errorText}`);
    }
    const data = await response.json();
    console.log('Raw models response:', data);
    
    // Handle different response formats from the API
    let modelsList = [];
    
    if (data && Array.isArray(data)) {
      // Direct array format
      modelsList = data;
      console.log('Direct array format detected');
    } else if (data && Array.isArray(data.data)) {
      // Object with data array format
      modelsList = data.data;
      console.log('Object with data array format detected');
    } else if (data && typeof data === 'object') {
      // Object with model properties format
      // Convert object keys to array of model IDs
      modelsList = Object.keys(data).map(key => ({
        id: key,
        name: key
      }));
      console.log('Object with model properties format detected');
    } else {
      console.error('Unrecognized model response format:', data);
      throw new Error('Invalid response format from OpenWebUI API.');
    }
    
    // Log the parsed models data for debugging
    console.log('Parsed models data:', modelsList);
    return modelsList;
  } catch (error) {
    console.error('Error in fetchModels:', error);
    handleApiError(error, 'fetchModels');
    throw error;
  }
};

export const sendChatMessage = async (openWebUIUrl, apiKey, model, messages, fileId = null) => {
  // Ensure model is a string (model ID)
  const modelId = typeof model === 'object' ? model.id : model;
  console.log('API: sendChatMessage called with model:', modelId);
  console.log('API: Messages count:', messages.length);
  console.log('API: File ID:', fileId);
  
  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    // Ensure the API key is properly formatted with 'Bearer ' prefix
    headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
    console.log('API: Using API key starting with:', apiKey.substring(0, 15) + '...');
  } else {
    console.warn('API: No API key provided for chat message');
  }

  try {
    // Format messages to ensure they follow the correct structure
    // Extract only the role and content from each message
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const payload = {
      model: modelId,
      messages: formattedMessages,
      stream: false
    };

    // Add file reference if provided
    if (fileId) {
      console.log('API: Adding file reference to payload:', fileId);
      payload.files = [
        { type: 'file', id: fileId }
      ];
    }

    console.log('API: Sending chat completion request');
    const response = await fetch(`${openWebUIUrl}/api/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    console.log('API: Received response with status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Error response body:', errorText);
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('API: Successfully parsed response:', data);
    
    // Extract the assistant message content
    let content = '';
    if (data.choices && data.choices[0] && data.choices[0].message) {
      content = data.choices[0].message.content;
      console.log('API: Extracted content from choices array');
    } else if (data.content) {
      content = data.content;
      console.log('API: Extracted content directly from response');
    } else {
      console.warn('API: Could not extract content from response:', data);
      // Return the entire data object as fallback
    }
    
    return data;
  } catch (error) {
    console.error('API: Error in sendChatMessage:', error);
    handleApiError(error, 'sendChatMessage');
    throw error;
  }
};
/**
 * Send a chat message with streaming response
 * @param {string} openWebUIUrl - The URL of the OpenWebUI API
 * @param {string} apiKey - The API key for authentication
 * @param {string} model - The model to use for the chat
 * @param {Array} messages - The messages to send
 * @param {string|null} fileId - The ID of the file to include in the message
 * @param {Function} onChunk - Callback function to handle each chunk of the response
 * @param {Function} onComplete - Callback function to handle the complete response
 * @returns {AbortController} - Controller that can be used to abort the stream
 */
export const sendChatMessageStreaming = async (openWebUIUrl, apiKey, model, messages, fileId = null, onChunk, onComplete) => {
  // Create an AbortController to allow canceling the stream
  const controller = new AbortController();
  const signal = controller.signal;
  // Ensure model is a string (model ID)
  const modelId = typeof model === 'object' ? model.id : model;
  console.log('API: sendChatMessageStreaming called with model:', modelId);
  console.log('API: Messages count:', messages.length);
  console.log('API: File ID:', fileId);
  
  const headers = {
    'Content-Type': 'application/json',
    'Connection': 'close',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no' // Disable nginx buffering
  };
  if (apiKey) {
    // Ensure the API key is properly formatted with 'Bearer ' prefix
    headers['Authorization'] = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
    console.log('API: Using API key starting with:', apiKey.substring(0, 15) + '...');
  } else {
    console.warn('API: No API key provided for streaming chat message');
  }

  try {
    // Format messages to extract only role and content, removing any additional metadata
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const payload = {
      model: modelId,
      messages: formattedMessages,
      stream: true // Enable streaming
    };
    
    console.log('API: Streaming request payload:', JSON.stringify(payload));

    // Add file reference if provided
    if (fileId) {
      console.log('API: Adding file reference to payload:', fileId);
      payload.files = [
        { type: 'file', id: fileId }
      ];
    }

    console.log('API: Sending streaming chat completion request');
    const response = await fetch(`${openWebUIUrl}/api/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal, // Add the abort signal
      keepalive: false, // Don't keep connection alive
      credentials: 'omit', // Don't send credentials
      mode: 'cors', // Ensure CORS is respected
      timeout: 60000 // 60 second timeout
    });

    console.log('API: Received response with status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API: Error response body:', errorText);
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    console.log('API: Starting to read streaming response');

    let abortCleanup = false;

    signal.addEventListener('abort', async () => {
      console.log('API: Stream aborted by user');
      abortCleanup = true;
      
      // Stop everything immediately
      try {
        await Promise.all([
          reader.cancel(),
          response.body?.cancel(),
          // Force terminate server-side generation
          fetch(`${openWebUIUrl}/api/stop`, {
            method: 'POST',
            headers,
            // Use a new abort controller with short timeout
            signal: AbortSignal.timeout(1000)
          })
        ]);
      } catch (e) {
        console.error('API: Error during abort cleanup:', e);
      }
      
      onComplete(fullContent);
    });

    try {
      // Use a wrapper that checks abort status
      const safeRead = async () => {
        if (signal.aborted || abortCleanup) return { done: true };
        return await reader.read();
      };

      while (true) {
        const { done, value } = await safeRead();
        if (done || signal.aborted || abortCleanup) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              let content = null;
              
              // Handle different streaming response formats
              if (parsed.choices && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                // OpenAI-compatible format
                content = parsed.choices[0].delta.content;
                console.log('API: Parsed OpenAI-compatible delta content');
              } else if (parsed.choices && parsed.choices[0].message && parsed.choices[0].message.content) {
                // Some APIs might send complete message chunks
                content = parsed.choices[0].message.content;
                console.log('API: Parsed complete message content chunk');
              } else if (parsed.content) {
                // Simpler format with direct content
                content = parsed.content;
                console.log('API: Parsed direct content');
              } else if (parsed.text) {
                // Another common format
                content = parsed.text;
                console.log('API: Parsed text content');
              }
              
              // Check abort status before adding content
              if (content && !signal.aborted && !abortCleanup) {
                // Only update content if not aborted
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              console.error('API: Error parsing streaming response:', e);
            }
          }
        }
      }
      
      // Only call onComplete if not aborted
      if (!signal.aborted) {
        console.log('API: Streaming complete, full content length:', fullContent.length);
        onComplete(fullContent);
      }
    } catch (error) {
      if (signal.aborted) {
        console.log('API: Stream was aborted by user');
        reader.cancel().catch(() => {});
        response.body?.cancel();
      } else {
        console.error('API: Error during streaming:', error);
        throw error;
      }
    } finally {
      // Ensure resources are cleaned up
      if (signal.aborted) {
        try {
          await fetch(`${openWebUIUrl}/api/stop`, {
            method: 'POST',
            headers
          });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  } catch (error) {
    console.error('API: Error in sendChatMessageStreaming:', error);
    handleApiError(error, 'sendChatMessageStreaming');
    throw error;
  }
  
  // Return the controller so it can be used to abort the stream
  return controller;
};
