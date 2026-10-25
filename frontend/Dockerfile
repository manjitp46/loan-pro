FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy configuration and source files
COPY tsconfig.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src/ ./src/
COPY public/ ./public/

# Expose Vite dev server port
EXPOSE 3000

# Start Vite dev server with host binding
CMD ["npm", "run", "dev"]
