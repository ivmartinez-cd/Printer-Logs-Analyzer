# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY ./ ./
ARG VITE_API_KEY
ENV VITE_API_KEY=$VITE_API_KEY
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage - Nginx
FROM nginx:alpine

# Security: Set up non-root user for Nginx
# Alpine's nginx image already has a 'nginx' user with UID 101.
# We need to ensure it can write to the necessary directories.
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

# Copy build artifacts
COPY --from=build /app/dist /usr/share/nginx/html

# Custom security-hardened Nginx config
RUN echo 'server { \
    listen 8080; \
    server_tokens off; \
    add_header X-Frame-Options "SAMEORIGIN"; \
    add_header X-XSS-Protection "1; mode=block"; \
    add_header X-Content-Type-Options "nosniff"; \
    add_header Referrer-Policy "strict-origin-when-cross-origin"; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Switch to the non-privileged user
USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
