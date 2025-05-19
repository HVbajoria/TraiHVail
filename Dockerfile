# Use the official Node.js 20 image as the base image
FROM  node:20

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

# Download and install libssl1.1
RUN wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_amd64.deb && \
    sudo dpkg -i libssl1.1_1.1.1f-1ubuntu2_amd64.deb && \
    rm libssl1.1_1.1.1f-1ubuntu2_amd64.deb

# Install pre-built Python 3.9
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3.9 \
    python3.9-slim \
    python3-pip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

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