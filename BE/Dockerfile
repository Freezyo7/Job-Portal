FROM mcr.microsoft.com/playwright/python:v1.61.0-noble

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Browsers/deps already ship in the base image; this is a no-op safety net
# in case the Playwright pin above ever drifts from the base image tag.
RUN playwright install --with-deps chromium

COPY . .

ENV PYTHONUNBUFFERED=1

CMD python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
