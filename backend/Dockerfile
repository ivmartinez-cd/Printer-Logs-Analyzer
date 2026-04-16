FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend
COPY data ./data
COPY migrations ./migrations

# Expose port and run
ENV PYTHONPATH=/app
ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "backend.interface.api:get_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
