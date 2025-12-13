# Multi-stage build with Node.js 18 and Python 3.11
FROM node:18-bullseye

# Install Python, Git LFS, and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    git-lfs \
    && git lfs install \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install Node dependencies
RUN npm install --production

# Copy backend code (Git LFS files will be pulled if present)
COPY . .

# Pull Git LFS files (in case they weren't pulled during COPY)
RUN git lfs pull || echo "No LFS files or already present"

# Install Python ML dependencies
RUN python3 -m pip install --no-cache-dir -r ml_engine/requirements.txt

# Train the ML model ONLY if .pkl files weren't pulled from Git LFS
RUN if [ ! -f ml_engine/crop_model.pkl ]; then \
      echo "⚠️  ML models not found in Git LFS, training now..." && \
      python3 ml_engine/train_model.py; \
    else \
      echo "✅ ML models loaded from Git LFS"; \
    fi

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
