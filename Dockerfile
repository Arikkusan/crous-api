# Use an official Node.js runtime as the base image
FROM node:latest

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# If you are building your code for production, run npm ci --only=production instead of npm install
# RUN npm ci --only=production

# Copy the rest of the application code to the working directory
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Command to start the application
CMD ["npm", "run", "start"]
