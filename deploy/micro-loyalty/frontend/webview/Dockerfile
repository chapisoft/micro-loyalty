# Production Frontend Nginx Dockerfile for Micro-Loyalty Webview GameHub
FROM nginx:1.25-alpine

COPY frontend/webview/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/webview/dist /usr/share/nginx/html
COPY config/frontend/env-config.json /usr/share/nginx/html/config/env-config.json
COPY locales /usr/share/nginx/html/locales

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
