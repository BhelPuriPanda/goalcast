# Stage 1: Build the React client
FROM node:18-alpine AS client-build
WORKDIR /app/client

# Copy package.json and install dependencies
COPY client/package*.json ./
RUN npm ci

# Copy the rest of the client code and build
COPY client/ ./
RUN npm run build

# Stage 2: Build and run the Express server
FROM node:18-alpine
WORKDIR /app

# Copy server package.json and install production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server source code
COPY server/ ./

# Copy built client assets from the previous stage
COPY --from=client-build /app/client/dist /app/client/dist

# Expose the API and WebSocket port
EXPOSE 8000

# Set required environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV HOST=0.0.0.0

# Start the server
CMD ["node", "server.js"]
