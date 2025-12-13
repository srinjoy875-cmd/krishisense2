# Multi-stage build with Node.js 18 and Python 3.11
FROM node:18-bullseye

# Install Python and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install Node dependencies
RUN npm install --production

# Copy backend code
COPY . .

# Install Python ML dependencies
RUN python3 -m pip install --no-cache-dir -r ml_engine/requirements.txt

# Train the ML model if .pkl files don't exist
RUN if [ ! -f ml_engine/crop_model.pkl ]; then \
      echo "Training ML model..." && \
      python3 ml_engine/train_model.py; \
    else \
      echo "ML models already present"; \
    fi

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
