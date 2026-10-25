FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++ sqlite

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source files
COPY tsconfig.json jest.config.js ./
COPY src/ ./src/
COPY tests/ ./tests/

# Expose backend port
EXPOSE 5000

# Run in development mode with hot reload
CMD ["npm", "run", "dev"]
