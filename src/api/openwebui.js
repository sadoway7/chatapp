import { handleApiError } from '../utils/error';

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

export const sendChatMessage = async (openWebUIUrl, apiKey, model, messages) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(`${openWebUIUrl}/api/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, stream: false }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send message: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return await response.json();
  } catch (error) {
    handleApiError(error, 'sendChatMessage');
    throw error;
  }
};
