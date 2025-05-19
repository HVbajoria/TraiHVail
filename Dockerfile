# Use the official Node.js 20 slim image as the base
FROM --platform=linux/amd64 node:20-slim

# Install Python 3.9, pip, and necessary build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3.9 \
        python3.9-distutils \
        wget \
        build-essential \
        libffi-dev \
        libssl-dev \
        zlib1g-dev \
        bzip2 \
        xz-utils \
        sudo \
        imagemagick && \
    # Install pip for Python 3.9
    wget https://bootstrap.pypa.io/get-pip.py && \
    python3.9 get-pip.py && \
    rm get-pip.py && \
    # Symlink python and pip commands
    ln -sf /usr/bin/python3.9 /usr/bin/python3 && \
    ln -sf /usr/local/bin/pip /usr/local/bin/pip3 && \
    # Cleanup
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Verify installations
RUN node -v && npm -v && python3 --version && pip3 --version

# Set working directory
WORKDIR /app

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Install Node.js dependencies and build assets
RUN npm install && npm run build

# Default command
CMD ["npm", "start"]
