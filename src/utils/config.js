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

import config from '../../public/config.json';

export const getDefaultSettings = () => {
  console.log('Default settings loaded:', config);
  return config;
};
