# Stage 1: build the React/Vite frontend into static files
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: serversideup/php is a production-hardened PHP+Apache image built
# specifically for cloud platforms like Railway/Render/Fly — it handles the
# $PORT environment variable and Apache setup internally, avoiding the
# "More than one MPM loaded" crash that the plain official php:apache image
# hits on Railway.
FROM serversideup/php:8.2-fpm-apache

# Serve both the API and the built frontend from one document root, so the
# frontend's existing relative '/api' calls keep working unchanged.
ENV APACHE_DOCUMENT_ROOT=/var/www/html

COPY --chown=www-data:www-data backend/ /var/www/html/api/
COPY --chown=www-data:www-data --from=frontend-build /app/dist/ /var/www/html/
