/**
 * Configuration utility.
 *
 * This file handles loading and providing access to the default configuration settings.
 *
 * Related files:
 * - src/App.jsx: Uses this utility to initialize default settings.
 * - public/config.json: The file containing the default configuration.
 *
 * For an overview of all project files, see `src/FILE_MAP.md`.
 */

// Default fallback config
const defaultConfig = {
  openWebUIUrl: "https://open.sadoway.ca",
  apiKey: "",
  selectedModel: "deepseekr138b.deepseek-r1"
};

// Cache for the loaded config
let configCache = null;

/**
 * Loads the configuration from the config.json file.
 * Uses a cache-busting query parameter to ensure the latest config is loaded.
 * Falls back to default values if the config file cannot be loaded.
 */
export const loadConfig = async () => {
  if (configCache) return configCache;
  
  try {
    // Add cache-busting query parameter
    const response = await fetch('/config.json?t=' + new Date().getTime());
    if (!response.ok) throw new Error('Failed to load config');
    
    configCache = await response.json();
    console.log('Loaded config from file:', configCache);
    return configCache;
  } catch (error) {
    console.error('Error loading config:', error);
    // Fallback to default config
    return defaultConfig;
  }
};

/**
 * Gets the default settings.
 * This is a synchronous function that returns the cached config or default values.
 * For asynchronous loading, use loadConfig() instead.
 */
export const getDefaultSettings = () => {
  if (configCache) {
    console.log('Returning cached config:', configCache);
    return configCache;
  }
  
  console.log('No cached config available, returning default values');
  return defaultConfig;
};
