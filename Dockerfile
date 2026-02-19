# Use Node 22 (matching your Render logs)
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the backend port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]