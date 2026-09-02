FROM mcr.microsoft.com/playwright/python:v1.61.0-noble

WORKDIR /app

# Ensure Python doesn't buffer logs and doesn't write .pyc files
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=10000

# Install dependencies first (for layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Ensure Chromium browser is ready for Playwright scrapers
RUN playwright install chromium

# Copy application source code
COPY . .

# Default command runs database migrations then starts Gunicorn web server.
# For Render Cron Job, override the start command with: python main.py --all
CMD python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
