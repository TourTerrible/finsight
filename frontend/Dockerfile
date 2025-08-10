# Build stage for Firebase hosting
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app for Firebase hosting
RUN npm run build

# The build output will be in /app/build directory
# This can be deployed to Firebase hosting using firebase deploy 