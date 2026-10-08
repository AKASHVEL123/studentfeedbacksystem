# ==============================================================================
# Dockerfile for Student Feedback Management System - FastAPI Backend
# ==============================================================================

# Use official lightweight Python base image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Avoid python bytecode generation and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install Python requirements
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application files
COPY backend/ /app/

# Expose FastAPI backend port
EXPOSE 8000

# Launch Uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
