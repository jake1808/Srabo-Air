FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Production WSGI server (dev workflow still works: compose rebuilds on change)
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:5000", "main:app"]
 