# Use a lightweight Node.js environment
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json files first (this caches dependencies to make builds faster)
COPY package*.json ./

# Install the dependencies (like 'sharp') inside the container
RUN npm install

# Copy your actual optimization script
COPY optimize.js ./

# Tell the container what to do when it starts
CMD ["node", "optimize.js"]