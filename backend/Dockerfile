# Dockerfile for Fins Pro - Complete Frontend + Backend Deployment

FROM node:18-alpine

# Set working directory to project root
WORKDIR /app

# Copy root package files (frontend)
COPY ../package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source code
COPY ../ ./

# Build frontend (creates dist/ folder)
RUN npm run build

# Now set up backend
WORKDIR /app/backend

# Copy backend package files
COPY package*.json ./

# Install backend dependencies
RUN npm install --production

# Copy backend source code
COPY . .

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start the backend server (which serves frontend from ../dist)
CMD ["node", "server.js"]
