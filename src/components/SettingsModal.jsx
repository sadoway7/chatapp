import React from 'react';

const SettingsModal = ({
  showSettings,
  setShowSettings,
  openWebUIUrl,
  setOpenWebUIUrl,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  models,
  handleSaveSettings,
  handleLoadDefaultSettings,
}) => {
  if (!showSettings) {
    return null;
  }

  return (
    <div className="settings-modal">
      <div className="settings-content"> {/* Added a container for content */}
        <h3>Settings</h3>
        <form className="settings-form" onSubmit={handleSaveSettings}>
          <div className="input-group"> {/* Group URL input */}
            <label htmlFor="openWebUIUrl">API URL:</label>
            <input type="text" id="openWebUIUrl" name="openWebUIUrl" value={openWebUIUrl} onChange={(e) => setOpenWebUIUrl(e.target.value)} />
          </div>

          <div className="input-group"> {/* Group API Key input */}
            <label htmlFor="apiKey">API Key:</label>
            <input type="password" id="apiKey" name="apiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>

          <div className="input-group"> {/* Group Model select */}
            <label htmlFor="selectedModel">Model:</label>
            <select id="selectedModel" name="selectedModel" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {models.map(model => <option key={model} value={model}>{model}</option>)}
            </select>
          </div>

          <div className="button-group"> {/* Group buttons */}
            <button type="button" onClick={handleLoadDefaultSettings}>Load Defaults</button>
            <button type="submit">Save</button>
          </div>
        </form>
        <button className="close-button" onClick={() => setShowSettings(false)}>Close Without Saving</button>
      </div>
    </div>
  );
};

export default SettingsModal;
