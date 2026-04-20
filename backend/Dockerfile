FROM python:3.11-slim

# Create a non-privileged user
RUN groupadd -r printerapp && useradd -r -g printerapp -s /sbin/nologin printerapp

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and ensure permissions
COPY backend ./backend
COPY backend/migrations ./migrations
# Ensure data directory exists and is writable
RUN mkdir -p /app/data && chown -R printerapp:printerapp /app

# Switch to non-privileged user
USER printerapp

ENV PYTHONPATH=/app
ENV PORT=8000
EXPOSE 8000

# Healthcheck to the app's health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["sh", "-c", "uvicorn backend.interface.api:app --host 0.0.0.0 --port 8000"]
