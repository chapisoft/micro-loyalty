# Production Nginx Gateway Reverse Proxy Dockerfile for Micro-Loyalty SaaS
FROM nginx:1.25-alpine

COPY config/nginx/nginx-saas.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
