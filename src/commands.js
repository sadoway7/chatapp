export const handleCommand = (command, setInput, setShowSettings) => {
  switch (command) {
    case 'settings':
      setShowSettings(true);
      break;
    // Add more commands here if needed
    default:
      console.log(`Unknown command: ${command}`);
  }
  setInput(''); // Clear the input field after handling a command
};
