# Use the official Node.js 20 image as the base image
FROM --platform=linux/arm64 node:20

# Update and install build dependencies and sudo
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libssl-dev \
    zlib1g-dev \
    bzip2 \
    xz-utils \
    wget \
    imagemagick \
    sudo && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Download and build Python 3.9.22 from source
RUN wget https://www.python.org/ftp/python/3.9.22/Python-3.9.22.tgz && \
    tar xzf Python-3.9.22.tgz && \
    cd Python-3.9.22 && \
    ./configure --enable-optimizations && \
    make && make install && \
    cd .. && rm -rf Python-3.9.22 Python-3.9.22.tgz

RUN pip3 install --upgrade pip

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy Python requirements file
COPY requirements.txt ./

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt



# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "start"]