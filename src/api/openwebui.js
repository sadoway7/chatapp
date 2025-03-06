import { handleApiError } from '../utils/error';

export const uploadFile = async (openWebUIUrl, apiKey, file) => {
  console.log('API: uploadFile called with file:', file.name, file.type, file.size);
  console.log('API: Using URL:', `${openWebUIUrl}/api/v1/files/`);
  
  const headers = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    console.log('API: Using authorization header');
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
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${openWebUIUrl}/api/models`, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}\n${errorText}`);
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from OpenWebUI API.');
    }
    return data.data;
  } catch (error) {
    handleApiError(error, 'fetchModels');
    throw error;
  }
};

export const sendChatMessage = async (openWebUIUrl, apiKey, model, messages, fileId = null) => {
  console.log('API: sendChatMessage called with model:', model);
  console.log('API: Messages count:', messages.length);
  console.log('API: File ID:', fileId);
  
  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    console.log('API: Using authorization header');
  }

  try {
    const payload = {
      model,
      messages,
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
    console.log('API: Successfully parsed response');
    return data;
  } catch (error) {
    console.error('API: Error in sendChatMessage:', error);
    handleApiError(error, 'sendChatMessage');
    throw error;
  }
};
