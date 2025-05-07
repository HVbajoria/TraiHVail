# Use the official Node.js image as the base image
FROM node:16-alpine

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy Python requirements file
COPY requirements.txt ./

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]