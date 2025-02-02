# L2PC Ollama Portal

A web-based interface for interacting with Ollama models, designed to run on Unraid.

## Prerequisites
- Unraid server
- Docker installed on Unraid
- Git access

## Installation Steps

1. **Navigate to appdata Directory**
   ```bash
   cd /mnt/user/appdata
   ```

2. **Clone the Repository**
   ```bash
   git clone https://github.com/sadoway7/L2PC-Ollama-Portal.git
   ```

3. **Configure Domain Access**
   ```bash
   cd L2PC-Ollama-Portal
   nano vite.config.js
   ```
   
   Replace the entire content of the file with:
   ```javascript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     preview: {
       host: '0.0.0.0',
       port: 4173,
       strictPort: true,
       allowedHosts: ['your.domain.com']  // Replace with your domain
     },
     server: {
       host: '0.0.0.0',
       port: 4173,
       strictPort: true,
       allowedHosts: ['your.domain.com']  // Replace with your domain
     }
   })
   ```
   
   Save the file:
   - Press `CTRL + X` to exit
   - Press `Y` to save changes
   - Press `ENTER` to confirm

4. **Configure Docker Container**
   - Open Unraid's Docker tab
   - Click "Add Container"
   - Configure the following settings:

   **Basic Configuration:**
   - Name: `L2PC-Ollama-Portal`
   - Repository: `node:20-slim`
   - Network Type: `Bridge`
   - Console: `Shell`

   **Post Arguments:**
   ```bash
   sh -c "cd /app && rm -rf node_modules package-lock.json && NODE_ENV=development npm install && npm run build && NODE_ENV=production npm run preview -- --host 0.0.0.0"
   ```

   **Path Configuration:**
   - Config Type: `Path`
   - Name: `App Data`
   - Host Path: `/mnt/user/appdata/L2PC-Ollama-Portal`
   - Container Path: `/app`

   **Port Configuration:**
   - Config Type: `Port`
   - Name: `Web UI`
   - Host Port: `4127`
   - Container Port: `4127`
   - Connection Type: `TCP`

5. **Start the Container**
   - Click "Apply" to save the container settings
   - Start the container from the Docker UI

6. **Access the Application**
   - Open your browser
   - Navigate to `http://your.domain.com:4127` or `http://localhost:4127`

7. **Initial Setup**
   - Send the message `settings123!` in the chat to access the settings menu
   - Configure your Ollama URL
   - Select your preferred model (e.g., llama2, mistral)
   - Save your settings

## Notes
- Settings access via `settings123!` is temporary and will be updated in future versions
- The configuration is currently stored in browser cache and needs to be set up locally on first use
- Server-side configuration is planned for future updates
- For cleaner URLs without port numbers, consider using NGINX for domain mapping

## Contributing
This is a hobby project I'm working on in my spare time. Feel free to open issues or submit pull requests, but please note that response times may vary as this is a side project.

## License
Released under MIT License. Feel free to use, modify, and share this project.

## Support
This is a hobby project maintained in my free time. If you find bugs or have questions, feel free to open an issue on GitHub. I'll help when I can, but responses might take some time.
