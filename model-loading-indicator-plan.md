# Model Loading Indicator Implementation Plan

## Overview

The goal is to add a visual indicator in the header that shows when a model is being loaded after switching models. Since the OpenWebUI API doesn't provide a direct way to check if a model is loaded or loading, we'll implement a solution that simulates this behavior.

## Implementation Steps

### 1. Add Model Loading State to App.jsx

```jsx
// Add a new state variable
const [isModelLoading, setIsModelLoading] = useState(false);
const [loadingModel, setLoadingModel] = useState('');
```

### 2. Update the Header Component

Modify the Header component to accept and display the model loading status:

```jsx
// Header.jsx
const Header = ({ handleClearChat, isModelLoading, loadingModel }) => {
  return (
    <div className="chat-header">
      <div className="logo-container">
        {/* Existing logo SVG */}
        <h2 className="logo-text">chat<span className="logo-dot">.</span>sadoway</h2>
      </div>
      
      {/* Add model loading indicator */}
      {isModelLoading && (
        <div className="model-loading-indicator">
          <div className="loading-spinner"></div>
          <span>Loading {loadingModel}...</span>
        </div>
      )}
      
      <div className="header-buttons">
        <button className="clear-button" onClick={handleClearChat}>
          Clear
        </button>
      </div>
    </div>
  );
};
```

### 3. Update Model Selection Logic in ChatInput.jsx

Modify the `selectModel` function to trigger the loading state:

```jsx
// ChatInput.jsx
const selectModel = (model) => {
  // Set the selected model
  setSelectedModel(model);
  
  // Trigger loading state in parent component
  onModelChange(model);
  
  // Close the dropdown
  setDropdownOpen(false);
};
```

Update the component props to include the new callback:

```jsx
const ChatInput = ({
  // Existing props
  onModelChange,
  // Other props
}) => {
  // Component implementation
};
```

### 4. Update App.jsx to Handle Model Changes

Add a handler function for model changes:

```jsx
const handleModelChange = (modelId) => {
  // Set loading state
  setIsModelLoading(true);
  setLoadingModel(modelId);
  
  // Store the model ID in localStorage
  localStorage.setItem('selectedModel', modelId);
  
  // Simulate loading time (3-5 seconds)
  setTimeout(() => {
    setIsModelLoading(false);
    setLoadingModel('');
  }, 3000 + Math.random() * 2000); // Random time between 3-5 seconds
};
```

Update the ChatInput component call:

```jsx
<ChatInput
  // Existing props
  onModelChange={handleModelChange}
  // Other props
/>
```

Update the Header component call:

```jsx
<Header 
  handleClearChat={handleClearChat} 
  isModelLoading={isModelLoading}
  loadingModel={loadingModel}
/>
```

### 5. Add CSS Styles for the Loading Indicator

Add the following CSS to index.css:

```css
/* Model loading indicator */
.model-loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(255, 152, 0, 0.15);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
  color: #f0f0f0;
  margin-right: 12px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #ff9800;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Additional Considerations

1. **Error Handling**: If the model fails to load, we should display an error message.
2. **Disable Input**: Consider disabling the chat input while a model is loading.
3. **Persistence**: The loading state should be reset if the page is refreshed.
4. **API Integration**: If the OpenWebUI API adds support for checking model loading status in the future, update the implementation to use the actual API.

## Testing

1. Test switching between different models
2. Test the loading indicator appearance and disappearance
3. Test the behavior when switching models rapidly
4. Test the behavior when sending messages while a model is loading

## Future Improvements

1. Add a progress bar or more detailed loading information if the API provides it
2. Add model-specific information in the header (e.g., parameter count, quantization)
3. Allow canceling a model load operation