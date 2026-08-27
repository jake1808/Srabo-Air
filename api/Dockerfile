FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Production WSGI server. --preload runs create_app (create_all + seed) once in
# the master before forking, so workers can't race each other on a fresh database.
CMD ["gunicorn", "--workers", "4", "--preload", "--bind", "0.0.0.0:5000", "main:app"]
 