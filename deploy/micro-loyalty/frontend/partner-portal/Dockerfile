# Production Frontend Nginx Dockerfile for Micro-Loyalty Partner Portal
FROM nginx:1.25-alpine

COPY frontend/partner-portal/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/partner-portal/dist /usr/share/nginx/html
COPY config/frontend/env-config.json /usr/share/nginx/html/config/env-config.json
COPY locales /usr/share/nginx/html/locales

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
