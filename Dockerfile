# Dockerfile for EMI Pro - Fly.io Deployment

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install --production

# Copy backend
COPY backend ./backend

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --production

# Copy frontend build (if exists)
WORKDIR /app
COPY dist ./dist

# Expose port
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Start the backend server
WORKDIR /app/backend
CMD ["node", "server.js"]
