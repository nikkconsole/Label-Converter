# BACKEND_URL - Base URL for API proxying (default: http://backend:5000)

FROM node:20-alpine AS build
WORKDIR /app
ARG BACKEND_URL=http://backend:5000
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
