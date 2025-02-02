# Use Node.js 18 as base
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies and Vite explicitly
RUN npm install && npm install vite@latest

# Copy the rest of the app
COPY . .

# Build the app
RUN npm run build

# Expose the port (make sure this matches your vite.config.js)
EXPOSE 4173

# Start the application in preview mode
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
