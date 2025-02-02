import React from 'react';
import { FiSettings } from 'react-icons/fi';

const Header = ({ handleClearChat, setShowSettings }) => {
  return (
    <div className="chat-header">
      <h2>L2PC Portal</h2>
      <div className="header-buttons">
        <button className="clear-button" onClick={handleClearChat}> {/* Erase button first */}
          Clear All
        </button>
        <button className="settings-button" onClick={() => setShowSettings(prev => !prev)}> {/* Then settings button */}
          <FiSettings />
        </button>
      </div>
    </div>
  );
};

export default Header;
