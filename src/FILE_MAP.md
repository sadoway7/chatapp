# Project File Map

This file provides an overview of all the files in the project and their purposes.

## Application Overview

This application is a web-based chat interface for interacting with language models through the OpenWebUI API. It allows users to send messages and receive responses, configure settings, and manage their chat history.

### Key Features

- Chat Interface: Send and receive messages from a language model.
- Command System: Use commands (e.g., ">settings") for specific actions.
- Settings Panel: Configure API keys, URLs, and models.
- Model Selection: Choose different language models.
- Clear Chat History: Erase all messages.
- Error Handling: Display messages for API errors.
- Copy Message: Copy assistant responses.
- Default Settings: Pre-configured settings.

## File Structure

- **`src/App.jsx`:** Main application component, managing state and UI.
- **`src/components/`:**
    - **`ChatInput.jsx`:** Component for user input and sending messages.
    - **`ChatMessages.jsx`:** Displays chat messages.
    - **`Header.jsx`:** Top bar with title and settings button.
    - **`SettingsModal.jsx`:** Modal for configuring settings.
- **`src/api/openwebui.js`:** Functions for interacting with the OpenWebUI API.
- **`src/commands.js`:** Handles command logic.
- **`src/config.json`:** Default configuration settings.
- **`src/index.css`:** Styles for the application.
- **`src/main.jsx`:** Entry point of the application.
- **`src/utils/`:**
    - **`config.js`:** Utility functions for managing configuration.
    - **`error.js`:** Error handling utilities.
    - **`message.jsx`:** Utility functions for handling message content.
- **`vite.config.js`:** Vite configuration file.
- **`package.json`:** Project dependencies and scripts.
- **`package-lock.json`:** Locked dependency versions.
- **`README.md`:** Project information.
- **`.gitignore`:** Files and folders ignored by Git.
