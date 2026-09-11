# Stage 1: build the React/Vite frontend into static files
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: PHP + Apache serves the built frontend AND the PHP backend
# from the same container/domain, so the frontend's existing relative
# '/api' calls (see frontend/src/services/api.js) work with zero changes.
FROM php:8.2-apache

RUN docker-php-ext-install mysqli \
    && a2enmod rewrite

# Backend PHP files live under /api on the live site, matching local dev
# (where XAMPP serves .../backend/api/... and the frontend calls /api/...).
COPY backend/ /var/www/html/api/

# Built frontend static files go at the web root.
COPY --from=frontend-build /app/dist/ /var/www/html/

# Apache vhost: lets React Router handle client-side routes (falls back
# to index.html for anything that isn't a real file/folder and isn't
# under /api), while /api/*.php still executes as PHP normally.
COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 80
