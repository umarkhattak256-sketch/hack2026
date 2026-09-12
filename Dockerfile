# Stage 1: build the React/Vite frontend into static files
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: serversideup/php is a production-hardened PHP+Apache image built
# specifically for cloud platforms like Railway. It expects the app to live
# under /var/www/html/public by default (Laravel-style convention) — we
# follow that convention exactly instead of overriding it, since PHP-FPM's
# own internal routing didn't respect the APACHE_DOCUMENT_ROOT override for
# .php execution (only static files respected it).
FROM serversideup/php:8.2-fpm-apache

COPY --chown=www-data:www-data backend/ /var/www/html/public/api/
COPY --chown=www-data:www-data --from=frontend-build /app/dist/ /var/www/html/public/
