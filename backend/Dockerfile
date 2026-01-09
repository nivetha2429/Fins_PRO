# Dockerfile for Fins Pro Backend - Render Deployment

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose port (Render uses PORT env variable)
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
