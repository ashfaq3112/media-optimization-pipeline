FROM node:18-slim

# Install build dependencies (sometimes needed for 'sharp' on slim images)
RUN apt-get update && apt-get install -y libvips-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy the entire optimizer folder contents
COPY . .

# Ensure the container knows where to find the script
CMD ["node", "optimize.js"]