import React from 'react';
import { FiSettings } from 'react-icons/fi';

const Header = ({ handleClearChat, setShowSettings }) => {
  return (
    <div className="chat-header">
      <div className="logo-container">
        <svg className="logo-svg" width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Dark background circle */}
          <circle cx="50" cy="50" r="48" fill="#1a1a1a" />
          
          {/* Geometric pattern - inspired by the examples but simplified */}
          <g fill="#ffffff">
            {/* Center circle */}
            <circle cx="50" cy="50" r="8" />
            
            {/* Chunky rays - 8 directions */}
            <rect x="46" y="15" width="8" height="25" />
            <rect x="46" y="60" width="8" height="25" />
            
            <rect x="15" y="46" width="25" height="8" />
            <rect x="60" y="46" width="25" height="8" />
            
            {/* Diagonal rays */}
            <rect x="25" y="25" width="8" height="20" transform="rotate(-45 25 25)" />
            <rect x="75" y="25" width="8" height="20" transform="rotate(45 75 25)" />
            <rect x="25" y="75" width="8" height="20" transform="rotate(-135 25 75)" />
            <rect x="75" y="75" width="8" height="20" transform="rotate(135 75 75)" />
            
            {/* Outer ring segments */}
            <path d="M50 10 A40 40 0 0 1 90 50 L82 50 A32 32 0 0 0 50 18 Z" />
            <path d="M90 50 A40 40 0 0 1 50 90 L50 82 A32 32 0 0 0 82 50 Z" />
            <path d="M50 90 A40 40 0 0 1 10 50 L18 50 A32 32 0 0 0 50 82 Z" />
            <path d="M10 50 A40 40 0 0 1 50 10 L50 18 A32 32 0 0 0 18 50 Z" />
          </g>
        </svg>
        <h2 className="logo-text">chat<span className="logo-dot">.</span>sadoway</h2>
      </div>
      <div className="header-buttons">
        <button className="clear-button" onClick={handleClearChat}> {/* Erase button first */}
          Clear
        </button>
        <button className="settings-button" onClick={() => setShowSettings(prev => !prev)}> {/* Then settings button */}
          <FiSettings />
        </button>
      </div>
    </div>
  );
};

export default Header;
